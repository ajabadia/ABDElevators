import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { PermissionPolicySchema, type PermissionPolicy } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/admin/permissions/policies
 * Lista todas las políticas de permiso del tenant
 */
async function GET_internal() {
    return withCorrelation(
        { level: 'INFO', source: 'API_PERMISSIONS_POLICIES', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const user = await requirePermission('permission:policy', 'read');
                const policiesCollection = await getTenantCollection<PermissionPolicy>('policies', user);
                const policies = await policiesCollection.find({});

                await log({
                    message: `Successfully retrieved ${policies.length} policies`,
                    details: { count: policies.length, tenantId: user.user.tenantId }
                });

                return NextResponse.json({ success: true, policies });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_PERMISSIONS_POLICIES_GET', correlationId);
            }
        }
    );
}

/**
 * POST /api/admin/permissions/policies
 * Crea una nueva política de permiso
 */
async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_PERMISSIONS_POLICIES', action: 'CREATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('permission:policy', 'write');
                const body = await req.json();
                const tenantId = session.user.tenantId;

                const policyData = {
                    ...body,
                    tenantId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: body.isActive ?? true
                };

                const validated = PermissionPolicySchema.parse(policyData);
                const policiesCollection = await getTenantCollection<PermissionPolicy>('policies', session);

                const result = await policiesCollection.insertOne(validated as any);

                await log({
                    message: `New policy created: ${validated.name}`,
                    details: { policyId: result.insertedId, name: validated.name, createdBy: session.user.email }
                });

                return NextResponse.json({
                    success: true,
                    policy: { ...validated, _id: result.insertedId }
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_ADMIN_PERMISSIONS_POLICIES_POST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/permissions/policies', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/permissions/policies', thresholdMs: 1000 });
