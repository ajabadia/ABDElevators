import { NextRequest, NextResponse } from 'next/server';
import { EntityEngine } from '@/core/engine/EntityEngine';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';
import { SecurityService } from '@/services/security/security-service';
import crypto from 'crypto';

/**
 * GET | PATCH | DELETE /api/core/entities/[type]/[id]
 * Endpoint universal para gestión de entidades vía System Engine.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    const { type, id } = await params;
    const correlacion_id = crypto.randomUUID();

    try {
        const entityDef = EntityEngine.getInstance().getEntity(type);
        if (!entityDef) {
            throw new AppError('NOT_FOUND', 404, `Entidad '${type}' no reconocida`);
        }

        const collection = await getTenantCollection(entityDef.slug);

        // Intentar buscar por ObjectId si el formato es válido, sino como string
        let query: any = { _id: id };
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
            entity, correlationId: correlacion_id
        });

    } catch (error: any) {
        console.error(`[ENTITY_CORE_GET] Error (${type}/${id}):`, error);
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error recuperando entidad').toJSON(),
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    const { type, id } = await params;
    const correlacion_id = crypto.randomUUID();

    try {
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

        let query: any = { _id: id };
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
            message: `${entityDef.name} actualizado: ${id}`, correlationId: correlacion_id
        });

        return NextResponse.json({ success: true, correlationId: correlacion_id });

    } catch (error: any) {
        if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
        return NextResponse.json(new AppError('INTERNAL_ERROR', 500, error.message).toJSON(), { status: 500 });
    }
}
