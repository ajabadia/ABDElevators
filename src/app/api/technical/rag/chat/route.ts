import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { AgenticRAGService } from '@/lib/langgraph-rag';
import { handleApiError } from '@/lib/errors';
import { SSEHelper } from '@/lib/sse-helper';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/technical/rag/chat
 * Allows technicians to perform direct queries to the agentic RAG graph.
 * Returns the generated response and the agent's thought trace.
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'TECHNICAL_RAG_CHAT_API', action: 'QUERY_CHAT' },
        async (log, correlationId) => {
            const start = Date.now();
            try {
                const session = await requirePermission('rag:query', 'read');
                const tenantId = session.user.tenantId;

                // Fetch tenant config to get industry dynamically (Regla de Oro #11)
                const { TenantService } = await import('@/services/tenant/tenant-service');
                const tenantConfig = await TenantService.getConfig(tenantId);

                const {
                    question,
                    messages = [],
                    stream = false,
                    industry = tenantConfig.industry || 'GENERIC',
                    environment = 'PRODUCTION',
                    filename // Phase 204
                } = await req.json();

                if (!question && messages.length === 0) {
                    return NextResponse.json({ error: 'La pregunta o el historial son obligatorios' }, { status: 400 });
                }

                const effectiveQuestion = question || (messages.length > 0 ? messages[messages.length - 1].content : '');

                await log({
                    action: stream ? 'QUERY_STREAM_START' : 'QUERY_START',
                    message: `Agentic query started: ${effectiveQuestion.substring(0, 50)}...`,
                    details: { stream, industry, filename }
                });

                if (effectiveQuestion && stream) {
                    const encoder = new TextEncoder();
                    const generator = AgenticRAGService.runStream(
                        effectiveQuestion,
                        tenantId,
                        correlationId,
                        messages,
                        industry,
                        environment,
                        filename
                    );

                    const customStream = new ReadableStream({
                        async pull(controller) {
                            try {
                                const { value, done } = await generator.next();

                                if (done) {
                                    controller.close();
                                    return;
                                }

                                // Enviamos el chunk como un evento JSON (formato SSE simplificado)
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
                            } catch (err: unknown) {
                                controller.error(err);
                            }
                        }
                    });

                    const streamWithHeartbeat = SSEHelper.wrapWithHeartbeat(customStream);

                    return new Response(streamWithHeartbeat, {
                        headers: {
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                        },
                    }) as unknown as NextResponse;
                }

                // Execute agentic RAG service (Non-streaming)
                const result = await AgenticRAGService.run(
                    effectiveQuestion,
                    tenantId,
                    correlationId,
                    messages,
                    industry,
                    environment,
                    filename
                );

                const durationMs = Date.now() - start;
                if (durationMs > 10000) {
                    await log({
                        level: 'WARN',
                        action: 'SLA_VIOLATION',
                        message: `Slow RAG query: ${durationMs}ms`,
                        details: { durationMs }
                    });
                }

                return NextResponse.json({
                    success: true,
                    answer: result.generation,
                    documents: result.documents,
                    trace: result.trace,
                    isSelfHealed: result.is_self_healed || false,
                    hallucinationScore: result.hallucination_score || 0,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'TECHNICAL_RAG_CHAT_API_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/rag/chat', thresholdMs: 10000 });
