import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db';
import { RagFeedbackSchema } from '@/lib/schemas/feedback';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { z } from 'zod';

/**
 * API Route: POST /api/feedback/answer
 * Submits feedback for a RAG answer.
 * FASE 195.1
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'Debes estar autenticado');
        }

        const body = await req.json();
        const validated = RagFeedbackSchema.parse(body);

        const collection = await getTenantCollection('rag_feedback', {
            tenantId: session.user.tenantId,
            role: session.user.role
        } as any);

        const feedbackEntry = {
            ...validated,
            tenantId: session.user.tenantId,
            userId: session.user.id,
            createdAt: new Date(),
        };

        await collection.insertOne(feedbackEntry);

        await logEvento({
            level: 'INFO',
            source: 'API_FEEDBACK',
            action: 'SUBMIT_ANSWER_FEEDBACK',
            correlationId,
            message: `Feedback ${validated.type} submitted for answer ${validated.answerId}`,
            details: {
                type: validated.type,
                answerId: validated.answerId,
                categories: validated.categories,
            },
        });

        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_FEEDBACK',
                action: 'PERFORMANCE_SLA_VIOLATION',
                correlationId,
                message: `Feedback submission took ${duration}ms`,
                details: { duration_ms: duration },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                code: 'VALIDATION_ERROR',
                message: 'Datos de feedback inválidos',
                details: error.issues,
            }, { status: 400 });
        }

        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        console.error(`[API_FEEDBACK] Error:`, error);
        await logEvento({
            level: 'ERROR',
            source: 'API_FEEDBACK',
            action: 'SUBMIT_ERROR',
            correlationId,
            message: error.message,
            stack: error.stack,
        });

        return NextResponse.json({
            code: 'INTERNAL_ERROR',
            message: 'Error al procesar el feedback',
        }, { status: 500 });
    }
}
