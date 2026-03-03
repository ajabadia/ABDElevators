import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { OrderAnalysisEngine as agentEngine } from '@/core/engine';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError } from '@/lib/errors';
import { AccessControlService } from '@/lib/access-control';
import { UsageService } from '@/services/ops/usage-service';
import { SSEHelper } from '@/lib/sse-helper';

interface GraphFinding {
    source: 'extraction' | 'risk_analysis' | 'validation';
    type: string;
    model: string;
    field?: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    originalValue?: any;
    correctedValue?: any;
    status?: string;
}

interface GraphState {
    messages: { role: string, content: string }[];
    entityId: string;
    tenantId: string;
    correlationId: string;
    industry: string;
    environment: string;
    confidence_score?: number;
    findings?: GraphFinding[];
}

/**
 * POST /api/pedidos/[id]/analyze
 * Ejecuta el motor agéntico para analizar un pedido.
 * Utiliza Server-Sent Events (SSE) para streaming de pasos.
 */
async function GET_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('technical:analysis', 'execute');
        const { id } = context.params;
        const tenantId = session.user.tenantId;

        // 2. Preparar el Stream de Eventos (SSE)
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (event: string, data: unknown) => {
                    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    // Validación de Cuota/Facturación antes de iniciar
                    await AccessControlService.checkUsageLimits(tenantId, 'REPORTS');

                    // 3. Obtener la entidad para tener el texto inicial
                    const collection = await getTenantCollection<any>('entities', session);
                    const entity = await collection.findOne({ _id: new ObjectId(id) });

                    if (!entity) {
                        sendEvent('error', { message: 'Entidad no encontrada' });
                        try { controller.close(); } catch (e) { }
                        return;
                    }

                    sendEvent('status', { message: 'Iniciando cerebro agéntico...', node: 'start' });

                    // 4. Ejecutar el Grafo Agéntico en modo streaming
                    const initialState = {
                        messages: [{ role: 'user', content: entity.originalText || '' }],
                        entityId: id,
                        tenantId,
                        correlationId,
                        industry: entity.industry || 'ELEVATORS',
                        environment: entity.environment || 'PRODUCTION'
                    };

                    const thread_id = `analyze_${id}_${Date.now()}`;
                    const config = { configurable: { thread_id } };

                    const eventStream = await agentEngine.stream(initialState, {
                        ...config,
                        streamMode: "values"
                    });

                    let finalState: GraphState | null = null;
                    for await (const update of eventStream) {
                        finalState = update as unknown as GraphState;
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
                            .filter((f: GraphFinding) => f.source === 'extraction')
                            .map((f: GraphFinding) => ({ type: f.type, model: f.model }));

                        const riesgos = (finalState.findings || [])
                            .filter((f: GraphFinding) => f.source === 'risk_analysis');

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

                        // Alerta Proactiva
                        if ((finalState.confidence_score || 0) < 0.70 || riesgos.some((r: GraphFinding) => r.severity === 'HIGH' || r.severity === 'CRITICAL')) {
                            const { NotificationService } = await import('@/services/core/NotificationService');
                            await NotificationService.notify({
                                tenantId,
                                type: 'RISK_ALERT',
                                level: (finalState.confidence_score || 0) < 0.50 ? 'ERROR' : 'WARNING',
                                title: `Análisis Crítico: ${entity.identifier}`,
                                message: `Confianza baja o riesgos críticos.`,
                                link: `/entities/${id}`,
                                metadata: { entityId: id, confidence: finalState.confidence_score }
                            });
                        }

                        // Registrar consumo
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

                    try { controller.close(); } catch (e) { }

                } catch (error: unknown) {
                    if (error instanceof AppError && error.code === 'FORBIDDEN') {
                        sendEvent('error', { message: error.message, type: 'BILLING_BLOCK' });
                    } else {
                        const message = error instanceof Error ? error.message : 'Error interno en el agente';
                        sendEvent('error', { message });
                    }
                    try { controller.close(); } catch (e) { }
                }
            }
        });

        const streamWithHeartbeat = SSEHelper.wrapWithHeartbeat(stream);

        return new Response(streamWithHeartbeat, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: unknown) {
        return handleApiError(error, 'TECHNICAL_ENTITIES_ANALYZE', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/analyze', thresholdMs: 5000 });
