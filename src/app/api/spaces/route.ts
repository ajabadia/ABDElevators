import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { auth, requirePermission } from '@/lib/auth';
import { SpaceService } from '@/services/tenant/space-service';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';

const QuerySchema = z.object({
    industry: z.string().optional(),
    isRoot: z.string().optional(),
    parentSpaceId: z.string().optional(),
    search: z.string().optional()
});

/**
 * [PHASE 125.2] Get Accessible Spaces for current user
 * SLA: P95 < 300ms
 */
export const GET = withPerformanceSLA(async (req: NextRequest) =>
    withCorrelation(
        { level: 'INFO', source: 'APISPACES', action: 'GETACCESSIBLESPACES' },
        async ({ log, correlationId }) => {
            try {
                const { searchParams } = new URL(req.url);
                const params = QuerySchema.parse(Object.fromEntries(searchParams));

                const user = await requirePermission('knowledge', 'read');
                const session = await auth();

                if (!session?.user?.id) {
                    throw new AppError('UNAUTHORIZED', 401, 'Session required');
                }

                const tenantId = TenantIdSchema.parse(session.user.tenantId);
                const userId = EntityIdSchema.parse(session.user.id);

                const items = await SpaceService.getAccessibleSpaces(
                    tenantId,
                    userId,
                    {
                        industry: params.industry,
                        isRoot: params.isRoot === 'true',
                        parentSpaceId: params.parentSpaceId ? EntityIdSchema.parse(params.parentSpaceId) : undefined,
                        search: params.search
                    },
                    session
                );

                await log({
                    message: 'Accessible spaces retrieved',
                    details: {
                        tenantId,
                        userId,
                        count: items.length
                    }
                });

                return NextResponse.json({
                    success: true,
                    items
                });

            } catch (error: unknown) {
                return handleApiError(error, 'APISPACES', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/spaces', thresholdMs: 1000 }
);
