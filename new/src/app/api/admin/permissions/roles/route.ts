import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { PermissionGroupSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { enforcePermission } from '@/lib/guardian-guard';
import crypto from 'crypto';

/**
 * GET /api/admin/permissions/roles
 * Lista todos los grupos (roles) de permiso del tenant
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const user = await enforcePermission('permission:role', 'read');
        const groupsCollection = await getTenantCollection('permission_groups', user);
        const roles = await groupsCollection.find({});

        return NextResponse.json({ success: true, roles });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PERMISSIONS_ROLES_GET', correlacion_id);
    }
}

/**
 * POST /api/admin/permissions/roles
 * Crea un nuevo grupo (role) de permiso
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const user = await enforcePermission('permission:role', 'write');
        const body = await req.json();
        const tenantId = (user as any).tenantId;

        const roleData = {
            ...body,
            tenantId,
            slug: body.name.toLowerCase().replace(/\s+/g, '-'),
            policies: body.policies || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const validated = PermissionGroupSchema.parse(roleData);
        const groupsCollection = await getTenantCollection('permission_groups', user);

        const result = await groupsCollection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'API_PERMISSIONS',
            action: 'CREATE_ROLE',
            message: `Nuevo rol creado: ${validated.name}`,
            correlationId: correlacion_id,
            details: { roleId: result.insertedId, name: validated.name },
            userEmail: (user as any).email || undefined
        });

        return NextResponse.json({
            success: true,
            role: { ...validated, _id: result.insertedId }
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PERMISSIONS_ROLES_POST', correlacion_id);
    }
}
