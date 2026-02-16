import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { OrderAnalysisEngine as agentEngine } from '@/core/engine';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError } from '@/lib/errors';
import { AccessControlService } from '@/lib/access-control';
import { UsageService } from '@/lib/usage-service';
import crypto from 'crypto';

/**
 * POST /api/pedidos/[id]/analyze
 * Ejecuta el motor agéntico para analizar un pedido.
 * Utiliza Server-Sent Events (SSE) para streaming de pasos.
 * Fulfills Phase 21.1 and 21.2.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const correlationId = crypto.randomUUID();

    // 1. Autorización
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // 2. Preparar el Stream de Eventos (SSE)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (event: string, data: any) => {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };

            try {
                // Validación de Cuota/Facturación antes de iniciar (Monetización)
                await AccessControlService.checkUsageLimits(tenantId, 'REPORTS');

                // 3. Obtener la entidad para tener el texto inicial
                const collection = await getTenantCollection<any>('entities', session);
                const entity = await collection.findOne({
                    _id: new ObjectId(id)
                });

                if (!entity) {
                    sendEvent('error', { message: 'Entidad no encontrada' });
                    controller.close();
                    return;
                }

                sendEvent('status', { message: 'Iniciando cerebro agéntico...', node: 'start' });

                // 4. Ejecutar el Grafo Agéntico en modo streaming
                // Usamos el texto extraído previamente del PDF (entity.originalText)
                const initialState = {
                    messages: [{ role: 'user', content: entity.originalText || '' }],
                    entityId: id,
                    tenantId,
                    correlationId
                };

                const thread_id = `analyze_${id}_${Date.now()}`;
                const config = { configurable: { thread_id } };

                // Recorremos los pasos del grafo
                const eventStream = await agentEngine.stream(initialState, {
                    ...config,
                    streamMode: "values" // Recibimos el estado completo en cada paso
                });

                let finalState: any = null;
                for await (const update of eventStream) {
                    finalState = update;
                    const lastMessage = update.messages[update.messages.length - 1];

                    sendEvent('trace', {
                        message: lastMessage?.content || 'Procesando...',
                        confidence: update.confidence_score,
                        findingsCount: update.findings?.length || 0
                    });
                }

                // 5. Persistir resultados finales en la entidad
                if (finalState) {
                    const detectedPatterns = (finalState.findings || [])
                        .filter((f: any) => f.source === 'extraction')
                        .map((f: any) => ({ type: f.type, model: f.model }));

                    const riesgos = (finalState.findings || [])
                        .filter((f: any) => f.source === 'risk_analysis');

                    await collection.updateOne(
                        { _id: new ObjectId(id) },
                        {
                            $set: {
                                detectedPatterns: detectedPatterns,
                                "metadata.risks": riesgos,
                                confidence_score: finalState.confidence_score || 0,
                                status: 'analyzed'
                            }
                        }
                    );

                    // Alerta Proactiva (Fase 82)
                    if ((finalState.confidence_score || 0) < 0.70 || riesgos.some((r: any) => r.severity === 'HIGH' || r.severity === 'CRITICAL')) {
                        const { NotificationService } = await import('@/lib/notification-service');
                        await NotificationService.notify({
                            tenantId: tenantId!,
                            type: 'RISK_ALERT',
                            level: (finalState.confidence_score || 0) < 0.50 ? 'ERROR' : 'WARNING',
                            title: `Análisis Crítico: ${entity.identifier}`,
                            message: `Se ha completado un análisis con confianza baja (${Math.round((finalState.confidence_score || 0) * 100)}%) o riesgos críticos. Revisión manual requerida.`,
                            link: `/entities/${id}`,
                            metadata: { entityId: id, confidence: finalState.confidence_score }
                        });
                    }

                    // Registrar consumo de "REPORTS" (Facturación)
                    try {
                        await UsageService.trackReportGeneration(tenantId, id);
                    } catch (usageErr) {
                        console.error('Error logging report usage:', usageErr);
                    }
                }

                sendEvent('complete', {
                    message: 'Análisis finalizado y guardado con éxito',
                    entityId: id,
                    correlationId
                });

                controller.close();

            } catch (error: any) {
                // Manejo especial para errores de facturación (AccessControl)
                if (error instanceof AppError && error.code === 'FORBIDDEN') {
                    sendEvent('error', { message: error.message, type: 'BILLING_BLOCK' });
                } else {
                    console.error('[AGENTIC_STREAM_ERROR]', error);
                    sendEvent('error', { message: error.message || 'Error interno en el agente' });
                }
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
