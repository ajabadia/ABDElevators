import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { SpaceService } from '@/services/tenant/space-service';
import { SpaceSchema, Space } from '@/lib/schemas/spaces';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';
import { withCorrelation } from '@/lib/logger/with-correlation';

const AdminQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    skip: z.coerce.number().min(0).default(0),
    search: z.string().optional()
});

/**
 * [PHASE 125.2] List Spaces (Admin Context)
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_SPACES', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge', 'read');
                const { searchParams } = new URL(req.url);
                const { limit, skip, search } = AdminQuerySchema.parse(Object.fromEntries(searchParams));

                const targetTenantId = searchParams.get('tenantId');
                const effectiveTenantId = (session.user.role === 'SUPER_ADMIN' && targetTenantId) 
                    ? targetTenantId 
                    : session.user.tenantId;

                const effectiveSession = {
                    ...session,
                    user: { ...session.user, tenantId: effectiveTenantId }
                };

                const collection = await getTenantCollection<Space>('spaces', effectiveSession);

                const filter: any = {};
                if (search) {
                    filter.$or = [
                        { name: { $regex: search, $options: 'i' } },
                        { slug: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } }
                    ];
                }

                const [items, total] = await Promise.all([
                    collection.find(filter, {
                        sort: { createdAt: -1 } as any,
                        skip,
                        limit
                    }),
                    collection.countDocuments(filter)
                ]);

                const serializedItems = items.map((item: any) => ({
                    ...item,
                    _id: item._id.toString(),
                    parentSpaceId: item.parentSpaceId ? item.parentSpaceId.toString() : undefined
                }));

                await log({
                    message: `Successfully retrieved ${items.length} spaces for tenant ${effectiveTenantId}`,
                    details: { count: items.length, total, search }
                });

                return NextResponse.json({
                    success: true,
                    items: serializedItems,
                    pagination: { total, limit, skip }
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_SPACES_GET', correlationId);
            }
        }
    );
}

/**
 * [PHASE 125.2] Create Space
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ADMIN_SPACES', action: 'CREATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge', 'manage_spaces');

                const { success } = await checkRateLimit(session.user.id, LIMITS.ADMIN);
                if (!success) {
                    await log({ level: 'WARN', message: `Rate limit hit for user ${session.user.id}` });
                    return NextResponse.json({ success: false, error: 'RATE_LIMIT' }, { status: 429 });
                }

                const body = await req.json();
                const validatedData = SpaceSchema.omit({ _id: true, createdAt: true, updatedAt: true }).parse(body);

                const tenantId = TenantIdSchema.parse(session.user.tenantId);
                const userId = EntityIdSchema.parse(session.user.id);

                const spaceId = await SpaceService.createSpace(
                    tenantId,
                    userId,
                    validatedData,
                    session
                );

                await log({
                    message: `New space created: ${validatedData.name}`,
                    details: { spaceId, tenantId, createdBy: session.user.email }
                });

                return NextResponse.json({
                    success: true,
                    spaceId
                }, { status: 201 });

            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_SPACES_POST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/spaces', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/spaces', thresholdMs: 1000 });
