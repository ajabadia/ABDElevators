import { getTenantCollection } from './db-tenant';
import { ContactRequestSchema, ContactRequest } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';
import { AppError } from '@/lib/errors';

/**
 * Servicio de Contacto y Soporte (Visión 2.0 - Fase 10)
 */
export class ContactService {
    /**
     * Crea una nueva solicitud de contacto.
     */
    static async createRequest(data: Partial<ContactRequest>, correlationId: string) {
        const validated = ContactRequestSchema.parse({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'pending'
        });

        const collection = await getTenantCollection('contact_requests');
        const result = await collection.insertOne(validated);

        await logEvento({
            level: 'INFO',
            source: 'CONTACT_SERVICE',
            action: 'CREATE_REQUEST',
            message: `Nueva solicitud de contacto de ${validated.email}`, correlationId,
            details: { id: result.insertedId, email: validated.email }
        });

        return result;
    }

    /**
     * Lista todas las solicitudes (Solo para SUPER_ADMIN o ADMIN Global).
     */
    static async listAll(tenantId?: string) {
        const collection = await getTenantCollection('contact_requests');
        const query = tenantId ? { tenantId } : {};
        return await collection.find(query, { sort: { createdAt: -1 } }) as any[];
    }

    /**
     * Responde a una solicitud.
     */
    static async respondRequest(id: string, answer: string, adminId: string, correlationId: string) {
        const collection = await getTenantCollection('contact_requests');

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    answer,
                    answeredBy: adminId,
                    status: 'resolved',
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Solicitud no encontrada');
        }

        await logEvento({
            level: 'INFO',
            source: 'CONTACT_SERVICE',
            action: 'RESPOND_REQUEST',
            message: `Solicitud ${id} respondida`, correlationId,
            details: { id, adminId }
        });

        return { success: true };
    }
}
