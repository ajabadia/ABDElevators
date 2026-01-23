import { getTenantCollection } from './db-tenant';
import { ContactRequestSchema, ContactRequest } from './schemas';
import { logEvento } from './logger';
import { ObjectId } from 'mongodb';
import { AppError } from './errors';

/**
 * Servicio de Contacto y Soporte (Visión 2.0 - Fase 10)
 */
export class ContactService {
    /**
     * Crea una nueva solicitud de contacto.
     */
    static async createRequest(data: Partial<ContactRequest>, correlacion_id: string) {
        const validated = ContactRequestSchema.parse({
            ...data,
            creado: new Date(),
            actualizado: new Date(),
            estado: 'pendiente'
        });

        const { collection } = await getTenantCollection('contact_requests');
        const result = await collection.insertOne(validated);

        await logEvento({
            nivel: 'INFO',
            origen: 'CONTACT_SERVICE',
            accion: 'CREATE_REQUEST',
            mensaje: `Nueva solicitud de contacto de ${validated.email}`,
            correlacion_id,
            detalles: { id: result.insertedId, email: validated.email }
        });

        return result;
    }

    /**
     * Lista todas las solicitudes (Solo para SUPER_ADMIN o ADMIN Global).
     */
    static async listAll(tenantId?: string) {
        const { collection } = await getTenantCollection('contact_requests');
        const query = tenantId ? { tenantId } : {};
        return await collection.find(query).sort({ creado: -1 }).toArray() as ContactRequest[];
    }

    /**
     * Responde a una solicitud.
     */
    static async respondRequest(id: string, respuesta: string, adminId: string, correlacion_id: string) {
        const { collection } = await getTenantCollection('contact_requests');

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    respuesta,
                    respondidoPor: adminId,
                    estado: 'resuelto',
                    actualizado: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Solicitud no encontrada');
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'CONTACT_SERVICE',
            accion: 'RESPOND_REQUEST',
            mensaje: `Solicitud ${id} respondida`,
            correlacion_id,
            detalles: { id, adminId }
        });

        return { success: true };
    }
}
