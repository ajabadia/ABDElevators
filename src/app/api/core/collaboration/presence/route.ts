import { NextRequest, NextResponse } from "next/server";
import { CollaborationService } from '@/services/core/CollaborationService';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { handleApiError, ValidationError } from "@/lib/errors";
import { withCorrelation } from '@/lib/logger/with-correlation';
import { EntityIdSchema } from "@/lib/schemas";
import { z } from "zod";

/**
 * POST /api/core/collaboration/presence
 * Actualiza y obtiene el estado de presencia en tiempo real.
 * SLA: P95 < 500ms
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_CORE_COLLABORATION_PRESENCE', action: 'UPDATE' },
        async ({ correlationId, log }) => {
            try {
                const session = await requirePermission('collaboration:presence', 'manage');
                const body = await req.json();
                
                // Rule #2: Zod Validation BEFORE Processing
                const { entityId } = z.object({ entityId: EntityIdSchema }).parse(body);

                const colSession = await CollaborationService.trackPresence(entityId, {
                    id: session.user.id || 'anon',
                    name: session.user.name || 'Técnico'
                });

                await log({
                    level: 'DEBUG',
                    message: `User ${session.user.id} updated presence on ${entityId}`,
                    details: { activeCollaborators: colSession.activeUsers?.length || 0 },
                    tenantId: session.user.tenantId
                });

                return NextResponse.json({
                    success: true,
                    collaborators: colSession.activeUsers,
                    correlationId
                });
            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    return handleApiError(new ValidationError('Invalid entityId', error.issues), 'API_PRESENCE', correlationId);
                }
                return handleApiError(error, 'API_CORE_COLLABORATION_PRESENCE_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/core/collaboration/presence', thresholdMs: 500 });
