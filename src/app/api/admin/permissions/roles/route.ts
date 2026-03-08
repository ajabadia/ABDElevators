import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { PermissionGroupSchema, type PermissionGroup } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { requirePermission } from '@/lib/auth';
const API_SOURCE = 'API_ADMIN_PERMISSIONS_ROLES';
const SLA_READ = 500;
const SLA_WRITE = 1000;

/**
 * GET /api/admin/permissions/roles
 * Lista todos los grupos (roles) de permiso del tenant
 */
async function GET_internal() {
    const correlationId = crypto.randomUUID();
    const start = Date.now();
    try {
        const user = await requirePermission('permission:role', 'read');
        const groupsCollection = await getTenantCollection<PermissionGroup>('permission_groups', user);
        const roles = await groupsCollection.find({});

        return NextResponse.json({ success: true, roles });
    } catch (error: unknown) {
        return handleApiError(error, `${API_SOURCE}_GET`, correlationId);
    } finally {
        const duration = Date.now() - start;
        if (duration > SLA_READ) {
            await logEvento({
                level: 'WARN',
                source: 'API_PERMISSIONS',
                action: 'PERF_SLA_VIOLATION',
                message: `GET /api/admin/permissions/roles tardó ${duration}ms`,
                correlationId,
                details: { duration_ms: duration, threshold_ms: SLA_READ }
            });
        }
    }
}

/**
 * POST /api/admin/permissions/roles
 * Crea un nuevo grupo (role) de permiso
 */
async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();
    try {
        const user = await requirePermission('permission:role', 'write');
        const body = await req.json();
        const tenantId = (user as any).tenantId as string;

        const roleData = {
            ...body,
            tenantId,
            slug: (body.name as string).toLowerCase().replace(/\s+/g, '-'),
            policies: body.policies || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const validated = PermissionGroupSchema.parse(roleData);
        const groupsCollection = await getTenantCollection<PermissionGroup>('permission_groups', user);

        const result = await groupsCollection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'API_PERMISSIONS',
            action: 'CREATE_ROLE',
            message: `Nuevo rol creado: ${validated.name}`,
            correlationId: correlationId,
            details: { roleId: result.insertedId, name: validated.name },
            userEmail: (user as any).email || undefined
        });

        return NextResponse.json({
            success: true,
            role: { ...validated, _id: result.insertedId }
        });
    } catch (error: unknown) {
        return handleApiError(error, `${API_SOURCE}_POST`, correlationId);
    } finally {
        const duration = Date.now() - start;
        if (duration > SLA_WRITE) {
            await logEvento({
                level: 'WARN',
                source: 'API_PERMISSIONS',
                action: 'PERF_SLA_VIOLATION',
                message: `POST /api/admin/permissions/roles tardó ${duration}ms`,
                correlationId,
                details: { duration_ms: duration, threshold_ms: SLA_WRITE }
            });
        }
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/permissions/roles', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/permissions/roles', thresholdMs: 1000 });
