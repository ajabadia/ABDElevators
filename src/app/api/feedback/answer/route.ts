import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db';
import { RagFeedbackSchema } from '@/lib/schemas/feedback';
import { logEvento } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('rag:query', 'read');
        const body = await req.json();
        const validated = RagFeedbackSchema.parse(body);

        const collection = await getTenantCollection('rag_feedback', session as any);
        await collection.insertOne({
            ...validated,
            tenantId: session.user.tenantId,
            userId: session.user.id,
            createdAt: new Date(),
            processed: false // Mark for background processing
        });

        await logEvento({ level: 'INFO', source: 'API_FEEDBACK', action: 'SUBMIT_FEEDBACK', message: `Feedback submitted for answer ${validated.answerId}`, correlationId, details: { type: validated.type, answerId: validated.answerId } });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, 'API_FEEDBACK', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/feedback/answer', thresholdMs: 1000 });
