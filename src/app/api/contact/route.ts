import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/services/support/ContactService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
async function POST_internal(request: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('user:profile', 'read');
        const body = await request.json();

        const result = await ContactService.createRequest({
            ...body, tenantId: session.user.tenantId, usuarioId: session.user.id
        }, correlationId);

        return NextResponse.json({ success: true, requestId: result.insertedId });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CONTACT', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/contact', thresholdMs: 1000 });
