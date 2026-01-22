import { getTenantCollection } from './db-tenant';
import { TaxonomySchema, IndustryType } from './schemas';
import { ObjectId } from 'mongodb';
import { AppError, ValidationError, NotFoundError } from './errors';
import { logEvento } from './logger';

/**
 * Servicio de Taxonomías (Visión 2.0 - Fase 7.3)
 */
export class TaxonomyService {
    /**
     * Obtiene todas las taxonomías activas para un tenant e industria.
     */
    static async getTaxonomies(tenantId: string, industry: IndustryType) {
        const { collection } = await getTenantCollection('taxonomias');
        return await collection.find({
            tenantId,
            industry,
            active: true
        }).toArray();
    }

    /**
     * Crea una nueva taxonomía.
     */
    static async createTaxonomy(data: any, correlacion_id: string) {
        const validated = TaxonomySchema.parse(data);
        const { collection } = await getTenantCollection('taxonomias');

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
            nivel: 'INFO',
            origen: 'TAXONOMY_SERVICE',
            accion: 'CREATE_TAXONOMY',
            mensaje: `Taxonomía '${validated.name}' creada para tenant ${validated.tenantId}`,
            correlacion_id,
            detalles: { key: validated.key, industry: validated.industry }
        });

        return { ...validated, _id: result.insertedId };
    }

    /**
     * Actualiza una taxonomía existente.
     */
    static async updateTaxonomy(id: string, data: any, tenantId: string, correlacion_id: string) {
        const { collection } = await getTenantCollection('taxonomias');

        const existing = await collection.findOne({
            _id: new ObjectId(id),
            tenantId
        });

        if (!existing) throw new NotFoundError('Taxonomía no encontrada');

        const updateData = {
            ...data,
            actualizado: new Date()
        };

        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        await logEvento({
            nivel: 'INFO',
            origen: 'TAXONOMY_SERVICE',
            accion: 'UPDATE_TAXONOMY',
            mensaje: `Taxonomía ${id} actualizada`,
            correlacion_id,
            detalles: { id, tenantId }
        });

        return { success: true };
    }
}
