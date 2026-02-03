import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AgenticRAGService } from '@/lib/langgraph-rag';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * POST /api/technical/rag/chat
 * Allows technicians to perform direct queries to the agentic RAG graph.
 * Returns the generated response and the agent's thought trace.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID no encontrado en la sesión' }, { status: 403 });
        }
        const { question, stream = false } = await req.json();

        if (!question) {
            return NextResponse.json({ error: 'La pregunta es obligatoria' }, { status: 400 });
        }

        await logEvento({
            level: 'INFO',
            source: 'TECHNICAL_RAG_CHAT_API',
            action: stream ? 'QUERY_STREAM_START' : 'QUERY_START',
            message: `Agentic query started: ${question.substring(0, 50)}...`,
            tenantId,
            correlationId
        });

        if (stream) {
            const encoder = new TextEncoder();
            const generator = AgenticRAGService.runStream(question, tenantId, correlationId);

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
                    } catch (err: any) {
                        controller.error(err);
                    }
                }
            });

            return new Response(customStream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        // Execute agentic RAG service (Non-streaming)
        const result = await AgenticRAGService.run(question, tenantId, correlationId);

        return NextResponse.json({
            success: true,
            answer: result.generation,
            documents: result.documents,
            trace: result.trace,
            correlationId
        });

    } catch (error: any) {
        console.error('[RAG_CHAT_ERROR]', error);

        await logEvento({
            level: 'ERROR',
            source: 'TECHNICAL_RAG_CHAT_API',
            action: 'QUERY_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            { success: false, error: 'Ocurrió un error procesando tu consulta agéntica' },
            { status: 500 }
        );
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
