import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/services/support/ContactService';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function POST_internal(request: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_SUPPORT_CONTACT', action: 'CREATE_REQUEST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('user:profile', 'read');
                const body = await request.json();
                const tenantId = session.user.tenantId;

                await log({
                    message: 'Processing new support/contact request',
                    tenantId
                });

                const result = await ContactService.createRequest({
                    ...body, 
                    tenantId, 
                    usuarioId: session.user.id
                }, correlationId);

                await log({
                    message: `Contact request created: ${result.insertedId}`,
                    details: { requestId: result.insertedId },
                    tenantId
                });

                return NextResponse.json({ 
                    success: true, 
                    requestId: result.insertedId,
                    correlationId 
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CONTACT_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/contact', thresholdMs: 1000 });
