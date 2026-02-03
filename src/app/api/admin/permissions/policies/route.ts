import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { PermissionPolicySchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { enforcePermission } from '@/lib/guardian-guard';
import crypto from 'crypto';

/**
 * GET /api/admin/permissions/policies
 * Lista todas las políticas de permiso del tenant
 */
export async function GET(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const user = await enforcePermission('permission:policy', 'read');
        const policiesCollection = await getTenantCollection('policies', user);
        const policies = await policiesCollection.find({});

        return NextResponse.json({ success: true, policies });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PERMISSIONS_POLICIES_GET', correlacion_id);
    }
}

/**
 * POST /api/admin/permissions/policies
 * Crea una nueva política de permiso
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    try {
        const user = await enforcePermission('permission:policy', 'write');
        const body = await req.json();
        const tenantId = (user as any).tenantId;

        const policyData = {
            ...body,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: body.isActive ?? true
        };

        const validated = PermissionPolicySchema.parse(policyData);
        const policiesCollection = await getTenantCollection('policies', user);

        const result = await policiesCollection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'API_PERMISSIONS',
            action: 'CREATE_POLICY',
            message: `Nueva política creada: ${validated.name}`,
            correlationId: correlacion_id,
            details: { policyId: result.insertedId, name: validated.name },
            userEmail: (user as any).email || undefined
        });

        return NextResponse.json({
            success: true,
            policy: { ...validated, _id: result.insertedId }
        });
    } catch (error) {
        return handleApiError(error, 'API_ADMIN_PERMISSIONS_POLICIES_POST', correlacion_id);
    }
}
