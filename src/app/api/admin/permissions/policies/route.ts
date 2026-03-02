import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { PermissionPolicySchema, type PermissionPolicy } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { enforcePermission } from '@/lib/guardian-guard';
import crypto from 'crypto';

const API_SOURCE = 'API_ADMIN_PERMISSIONS_POLICIES';
const SLA_READ = 500;
const SLA_WRITE = 1000;

/**
 * GET /api/admin/permissions/policies
 * Lista todas las políticas de permiso del tenant
 */
export async function GET() {
    const correlationId = crypto.randomUUID();
    const start = Date.now();
    try {
        const user = await enforcePermission('permission:policy', 'read');
        const policiesCollection = await getTenantCollection<PermissionPolicy>('policies', user);
        const policies = await (policiesCollection.find({}) as any).toArray();

        return NextResponse.json({ success: true, policies });
    } catch (error: unknown) {
        return handleApiError(error, `${API_SOURCE}_GET`, correlationId);
    } finally {
        const duration = Date.now() - start;
        if (duration > SLA_READ) {
            await logEvento({
                level: 'WARN',
                source: 'API_PERMISSIONS',
                action: 'PERF_SLA_VIOLATION',
                message: `GET /api/admin/permissions/policies tardó ${duration}ms`,
                correlationId,
                details: { duration_ms: duration, threshold_ms: SLA_READ }
            });
        }
    }
}

/**
 * POST /api/admin/permissions/policies
 * Crea una nueva política de permiso
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();
    try {
        const user = await enforcePermission('permission:policy', 'write');
        const body = await req.json();
        const tenantId = (user as any).tenantId as string;

        const policyData = {
            ...body,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: body.isActive ?? true
        };

        const validated = PermissionPolicySchema.parse(policyData);
        const policiesCollection = await getTenantCollection<PermissionPolicy>('policies', user);

        const result = await policiesCollection.insertOne(validated as any);

        await logEvento({
            level: 'INFO',
            source: 'API_PERMISSIONS',
            action: 'CREATE_POLICY',
            message: `Nueva política creada: ${validated.name}`,
            correlationId: correlationId,
            details: { policyId: result.insertedId, name: validated.name },
            userEmail: (user as any).email || undefined
        });

        return NextResponse.json({
            success: true,
            policy: { ...validated, _id: result.insertedId }
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
                message: `POST /api/admin/permissions/policies tardó ${duration}ms`,
                correlationId,
                details: { duration_ms: duration, threshold_ms: SLA_WRITE }
            });
        }
    }
}
