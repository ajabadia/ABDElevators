import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/services/support/ContactService';
import { handleApiError, AppError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { ContactRequestSchema } from '@/lib/schemas';
import { z } from 'zod';

/**
 * Endpoint Admin para gestionar solicitudes de contacto (Phase 70 compliance).
 */
async function GET_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_CONTACT', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('support', 'read');

                const requests = await ContactService.listAll(session.user.role === UserRole.SUPER_ADMIN ? undefined : session.user.tenantId as any);
                
                await log({
                    message: `Successfully retrieved ${requests.length} contact requests`,
                    details: { count: requests.length, tenantId: session.user.tenantId }
                });

                return NextResponse.json({ requests });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_CONTACT_LIST', correlationId);
            }
        }
    );
}

async function PATCH_internal (req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_CONTACT', action: 'RESPOND' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('support', 'manage');

                const body = await req.json();
                
                // 🛡️ [ERA 8] Zod Validation BEFORE Processing
                const validated = ContactRequestSchema.partial().extend({
                    id: z.string(),
                    respuesta: z.string().min(1)
                }).parse(body);

                const { id, respuesta } = validated;

                await ContactService.respondRequest(id, respuesta, session.user.id as any, session.user.tenantId as any);

                await log({
                    message: `Customer contact request ${id} responded`,
                    details: { id, respondedBy: session.user.email }
                });

                return NextResponse.json({ success: true });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_CONTACT_RESPOND', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/contacts', thresholdMs: 1000 });

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/contacts', thresholdMs: 1000 });
