import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { PermissionGroupSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * GET /api/admin/permissions/roles
 * Lista todos los grupos (roles) de permiso del tenant
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'Solo administradores pueden gestionar roles');
        }

        const groupsCollection = await getTenantCollection('permission_groups', session);
        const roles = await groupsCollection.find({});

        // Enriquecer con conteo de miembros (opcional, para la UI)
        // Podríamos hacer un aggregation si fuera necesario.

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
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            throw new AppError('UNAUTHORIZED', 403, 'Solo administradores pueden crear roles');
        }

        const body = await req.json();
        const tenantId = session.user.tenantId;

        const roleData = {
            ...body,
            tenantId,
            slug: body.name.toLowerCase().replace(/\s+/g, '-'),
            policies: body.policies || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const validated = PermissionGroupSchema.parse(roleData);
        const groupsCollection = await getTenantCollection('permission_groups', session);

        const result = await groupsCollection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'API_PERMISSIONS',
            action: 'CREATE_ROLE',
            message: `Nuevo rol creado: ${validated.name}`,
            correlationId: correlacion_id,
            details: { roleId: result.insertedId, name: validated.name },
            userEmail: session.user.email || undefined
        });

        return NextResponse.json({
            success: true,
            role: { ...validated, _id: result.insertedId }
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PERMISSIONS_ROLES_POST', correlacion_id);
    }
}
