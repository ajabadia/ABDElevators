import { NextRequest, NextResponse } from 'next/server';
import { EntityEngine } from '@/core/engine/EntityEngine';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';
import { SecurityService } from '@/services/security/security-service';
import { enforcePermission } from '@/lib/guardian-guard';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET | PATCH /api/core/entities/[type]/[id]
 * Endpoint universal para gestión de entidades vía System Engine.
 * SLA: P95 < 2000ms
 */
export const GET = withPerformanceSLA(async (
    req: NextRequest,
    { params }: { params: Promise<{ type: string; id: string }> }
) => {
    const { type, id } = await params;
    const correlationId = crypto.randomUUID();

    try {
        await enforcePermission('technical:entities', 'read');

        const entityDef = EntityEngine.getInstance().getEntity(type);
        if (!entityDef) {
            throw new AppError('NOT_FOUND', 404, `Entidad '${type}' no reconocida`);
        }

        const collection = await getTenantCollection(entityDef.slug);

        // Intentar buscar por ObjectId si el formato es válido, sino como string
        let query: Record<string, unknown> = { _id: id };
        if (ObjectId.isValid(id)) {
            query = { _id: new ObjectId(id) };
        }

        const entity = await collection.findOne(query);

        if (!entity) {
            throw new AppError('NOT_FOUND', 404, `${entityDef.name} no encontrado`);
        }

        // Descifrar campos sensibles antes de devolver (Fase Security Hardening)
        entityDef.fields.forEach(field => {
            if (SecurityService.shouldEncryptField(field.key) && entity[field.key]) {
                entity[field.key] = SecurityService.decrypt(entity[field.key]);
            }
        });

        return NextResponse.json({
            success: true,
            entity,
            correlationId
        });

    } catch (error: unknown) {
        return handleApiError(error, `API_CORE_ENTITIES_GET_${type}_${id}`, correlationId);
    }
}, { endpoint: 'GET /api/core/entities/[type]/[id]', thresholdMs: 2000 });

export const PATCH = withPerformanceSLA(async (
    req: NextRequest,
    { params }: { params: Promise<{ type: string; id: string }> }
) => {
    const { type, id } = await params;
    const correlationId = crypto.randomUUID();

    try {
        await enforcePermission('technical:entities', 'update');

        const entityDef = EntityEngine.getInstance().getEntity(type);
        if (!entityDef) throw new AppError('NOT_FOUND', 404, 'Entidad no reconocida');

        const body = await req.json();
        const collection = await getTenantCollection(entityDef.slug);

        // Cifrar campos sensibles antes de guardar (Fase Security Hardening)
        entityDef.fields.forEach(field => {
            if (SecurityService.shouldEncryptField(field.key) && body[field.key]) {
                body[field.key] = SecurityService.encrypt(body[field.key]);
            }
        });

        let query: Record<string, unknown> = { _id: id };
        if (ObjectId.isValid(id)) {
            query = { _id: new ObjectId(id) };
        }

        const result = await collection.updateOne(query, { $set: body });

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Entidad no encontrada para actualizar');
        }

        await logEvento({
            level: 'INFO',
            source: 'CORE_ENTITY_UPDATE',
            action: 'UPDATE',
            message: `${entityDef.name} actualizado: ${id}`,
            correlationId
        });

        return NextResponse.json({ success: true, correlationId });

    } catch (error: unknown) {
        return handleApiError(error, `API_CORE_ENTITIES_PATCH_${type}_${id}`, correlationId);
    }
}, { endpoint: 'PATCH /api/core/entities/[type]/[id]', thresholdMs: 2000 });
