import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { agentEngine } from '@/lib/agent-engine';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { AppError } from '@/lib/errors';
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
    const correlacion_id = crypto.randomUUID();

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
                // 3. Obtener el pedido para tener el texto inicial
                const db = await connectDB();
                const pedido = await db.collection('pedidos').findOne({
                    _id: new ObjectId(id),
                    tenantId
                });

                if (!pedido) {
                    sendEvent('error', { message: 'Pedido no encontrado' });
                    controller.close();
                    return;
                }

                sendEvent('status', { message: 'Iniciando cerebro agéntico...', node: 'start' });

                // 4. Ejecutar el Grafo Agéntico en modo streaming
                // Usamos el texto extraído previamente del PDF (pedido.pdf_texto)
                const initialState = {
                    messages: [{ role: 'user', content: pedido.pdf_texto || '' }],
                    pedidoId: id,
                    tenantId,
                    correlacion_id
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

                // 5. Persistir resultados finales en el pedido
                if (finalState) {
                    const modelos = (finalState.findings || [])
                        .filter((f: any) => f.source === 'extraction')
                        .map((f: any) => ({ tipo: f.tipo, modelo: f.modelo }));

                    const riesgos = (finalState.findings || [])
                        .filter((f: any) => f.source === 'risk_analysis');

                    await db.collection('pedidos').updateOne(
                        { _id: new ObjectId(id) },
                        {
                            $set: {
                                modelos_detectados: modelos,
                                "metadata.risks": riesgos,
                                estado: 'analizado',
                                actualizado: new Date()
                            }
                        }
                    );
                }

                sendEvent('complete', {
                    message: 'Análisis finalizado y guardado con éxito',
                    pedidoId: id,
                    correlacion_id
                });

                controller.close();

            } catch (error: any) {
                console.error('[AGENTIC_STREAM_ERROR]', error);
                sendEvent('error', { message: error.message || 'Error interno en el agente' });
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
