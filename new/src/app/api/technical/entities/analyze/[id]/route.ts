import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';
import { connectLogsDB } from '@/lib/db';

/**
 * GET /api/technical/entities/analyze/[id]
 * SSE Endpoint to track analysis progress.
 * Phase 31: Async Jobs + Real-time Observability.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Configuración para SSE
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            const sendEvent = (event: string, data: any) => {
                const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
                controller.enqueue(encoder.encode(message));
            };

            try {
                const entitiesCollection = await getTenantCollection('entities');

                // 1. Verificar existencia y estado inicial
                let entity = await entitiesCollection.findOne({ _id: new ObjectId(id) });
                if (!entity) {
                    sendEvent('error', { message: 'Entity not found' });
                    controller.close();
                    return;
                }

                sendEvent('status', { message: `Conexión establecida. Iniciando rastreo de ${entity.filename}...` });

                // 2. Sondear cambio de estado y logs asociados (Long polling inside SSE)
                // En un entorno de producción real, usaríamos Change Streams o Redis Pub/Sub.
                // Para este MVP industrial, sondeamos el estado y los logs de auditoría.

                const correlationId = (entity as any).correlationId;
                let lastStatus = entity.status;
                let processedLogs = new Set<string>();

                const interval = setInterval(async () => {
                    try {
                        // Refrescar documento
                        entity = await entitiesCollection.findOne({ _id: new ObjectId(id) });
                        if (!entity) return;

                        // Si cambió el estado, notificar
                        if (entity.status !== lastStatus) {
                            sendEvent('status', { message: `Cambio de estado: ${entity.status.toUpperCase()}` });
                            lastStatus = entity.status;
                        }

                        // Buscar logs técnicos recientes para este correlationId
                        const logsDb = await connectLogsDB();
                        const logs = await logsDb.collection('logs').find({
                            correlationId,
                            level: { $ne: 'DEBUG' } // Solo logs interesantes
                        }).sort({ createdAt: 1 }).toArray();

                        for (const log of logs) {
                            const logKey = log._id.toString();
                            if (!processedLogs.has(logKey)) {
                                sendEvent('trace', {
                                    message: log.message,
                                    confidence: log.details?.confidence,
                                    findingsCount: log.details?.risksCount
                                });
                                processedLogs.add(logKey);
                            }
                        }

                        // Si terminó, cerrar
                        if (entity.status === 'analyzed' || entity.status === 'error') {
                            sendEvent('status', { message: entity.status === 'analyzed' ? 'Análisis finalizado con éxito.' : 'El análisis falló.' });
                            sendEvent('complete', { success: entity.status === 'analyzed' });
                            clearInterval(interval);
                            controller.close();
                        }

                    } catch (err) {
                        console.error("[SSE] Error in trace loop:", err);
                    }
                }, 1000);

                // Timeout de seguridad de 5 minutos
                setTimeout(() => {
                    clearInterval(interval);
                    try { controller.close(); } catch (e) { }
                }, 300000);

            } catch (error) {
                console.error("[SSE] Fatal error:", error);
                sendEvent('error', { message: 'Stream connection error' });
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
