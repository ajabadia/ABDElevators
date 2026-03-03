import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { AgenticRAGService } from '@/lib/langgraph-rag';
import { logEvento } from '@/lib/logger';
import { AppError, handleApiError } from '@/lib/errors';
import { SSEHelper } from '@/lib/sse-helper';

/**
 * POST /api/technical/rag/chat
 * Allows technicians to perform direct queries to the agentic RAG graph.
 * Returns the generated response and the agent's thought trace.
 */
async function POST_internal(req: NextRequest) {
    const correlationId = globalThis.crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await enforcePermission('rag:query', 'read');
        const tenantId = session.user.tenantId;

        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }

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

        await logEvento({
            level: 'INFO',
            source: 'TECHNICAL_RAG_CHAT_API',
            action: stream ? 'QUERY_STREAM_START' : 'QUERY_START',
            message: `Agentic query started: ${effectiveQuestion.substring(0, 50)}...`,
            tenantId,
            correlationId
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
            });
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
        return handleApiError(error, 'TECHNICAL_RAG_CHAT_API', correlationId);
    } finally {
        const durationMs = Date.now() - start;
        if (durationMs > 10000) {
            await logEvento({
                level: 'WARN',
                source: 'TECHNICAL_RAG_CHAT_API',
                action: 'SLA_VIOLATION',
                message: `Slow RAG query: ${durationMs}ms`,
                correlationId,
                details: { durationMs }
            });
        }
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/rag/chat', thresholdMs: 1000 });
