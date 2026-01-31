import { getTenantCollection } from './db-tenant';
import { TaxonomySchema, IndustryType } from '@/lib/schemas';
import { ObjectId } from 'mongodb';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

/**
 * Servicio de Taxonomías (Visión 2.0 - Fase 7.3)
 */
export class TaxonomyService {
    /**
     * Obtiene todas las taxonomías activas para un tenant e industria.
     */
    static async getTaxonomies(tenantId: string, industry: IndustryType) {
        const collection = await getTenantCollection('taxonomias');
        return await collection.find({
            tenantId,
            industry,
            active: true
        });
    }

    /**
     * Crea una nueva taxonomía.
     */
    static async createTaxonomy(data: any, correlationId: string) {
        const validated = TaxonomySchema.parse(data);
        const collection = await getTenantCollection('taxonomias');

        // Verificar si la clave ya existe para este tenant/industria
        const existing = await collection.findOne({
            tenantId: validated.tenantId,
            industry: validated.industry,
            key: validated.key
        });

        if (existing) {
            throw new ValidationError(`La clave de taxonomía '${validated.key}' ya existe para esta industria`);
        }

        const result = await collection.insertOne(validated);

        await logEvento({
            level: 'INFO',
            source: 'TAXONOMY_SERVICE',
            action: 'CREATE_TAXONOMY',
            message: `Taxonomía '${validated.name}' creada para tenant ${validated.tenantId}`, correlationId,
            details: { key: validated.key, industry: validated.industry }
        });

        return { ...validated, _id: result.insertedId };
    }

    /**
     * Actualiza una taxonomía existente.
     */
    static async updateTaxonomy(id: string, data: any, tenantId: string, correlationId: string) {
        const collection = await getTenantCollection('taxonomias');

        const existing = await collection.findOne({
            _id: new ObjectId(id),
            tenantId
        });

        if (!existing) throw new NotFoundError('Taxonomía no encontrada');

        const updateData = {
            ...data,
            updatedAt: new Date()
        };

        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        await logEvento({
            level: 'INFO',
            source: 'TAXONOMY_SERVICE',
            action: 'UPDATE_TAXONOMY',
            message: `Taxonomía ${id} actualizada`, correlationId,
            details: { id, tenantId }
        });

        return { success: true };
    }
}
