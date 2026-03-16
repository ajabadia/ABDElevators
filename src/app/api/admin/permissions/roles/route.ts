import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { PermissionGroupSchema, type PermissionGroup } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/permissions/roles
 * Lista todos los grupos (roles) de permiso del tenant
 */
async function GET_internal() {
    return withCorrelation(
        { level: 'INFO', source: 'API_PERMISSIONS_ROLES', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const user = await requirePermission('permission:role', 'read');
                const groupsCollection = await getTenantCollection<PermissionGroup>('permission_groups', user);
                const roles = await groupsCollection.find({});

                await log({
                    message: `Successfully retrieved ${roles.length} roles`,
                    details: { count: roles.length, tenantId: user.user.tenantId }
                });

                return NextResponse.json({ success: true, roles });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_PERMISSIONS_ROLES_GET', correlationId);
            }
        }
    );
}

/**
 * POST /api/admin/permissions/roles
 * Crea un nuevo grupo (role) de permiso
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_PERMISSIONS_ROLES', action: 'CREATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('permission:role', 'write');
                const body = await req.json();
                const tenantId = session.user.tenantId;

                const roleData = {
                    ...body,
                    tenantId,
                    slug: (body.name as string).toLowerCase().replace(/\s+/g, '-'),
                    policies: body.policies || [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const validated = PermissionGroupSchema.parse(roleData);
                const groupsCollection = await getTenantCollection<PermissionGroup>('permission_groups', session);

                const result = await groupsCollection.insertOne(validated as any);

                await log({
                    message: `New role created: ${validated.name}`,
                    details: { roleId: result.insertedId, name: validated.name, createdBy: session.user.email }
                });

                return NextResponse.json({
                    success: true,
                    role: { ...validated, _id: result.insertedId }
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_PERMISSIONS_ROLES_POST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/permissions/roles', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/permissions/roles', thresholdMs: 1000 });
