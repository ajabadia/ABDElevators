import { getTenantCollection } from '@/lib/db-tenant';
import { ContactRequestSchema, ContactRequest } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';
import { AppError } from '@/lib/errors';
import { EntityId, TenantId } from '@/lib/schemas/common';

/**
 * Contact and Support Service (Vision 2.0 - Phase 10)
 */
export class ContactService {
    /**
     * Creates a new contact request.
     */
    static async createRequest(data: Partial<ContactRequest>, correlationId: string) {
        const validated = ContactRequestSchema.parse({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'pending'
        });

        const { _id, ...insertData } = validated;
        const collection = await getTenantCollection('contact_requests');
        const result = await collection.insertOne(insertData as any);

        await logEvento({
            level: 'INFO',
            source: 'CONTACT_SERVICE',
            action: 'CREATE_REQUEST',
            message: `New contact request from ${validated.email}`, correlationId,
            details: { id: result.insertedId, email: validated.email }
        });

        return result;
    }

    /**
     * Lists all requests (Only for SUPER_ADMIN or Global ADMIN).
     */
    static async listAll(tenantId?: string) {
        const collection = await getTenantCollection('contact_requests');
        const query = tenantId ? { tenantId } : {};
        return await collection.find(query, { sort: { createdAt: -1 } }) as any[];
    }

    /**
     * Responds to a request.
     */
    static async respondRequest(id: string, answer: string, adminId: string, correlationId: string) {
        const collection = await getTenantCollection('contact_requests');

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    answer,
                    answeredBy: adminId as EntityId,
                    status: 'resolved',
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new AppError('NOT_FOUND', 404, 'Request not found');
        }

        await logEvento({
            level: 'INFO',
            source: 'CONTACT_SERVICE',
            action: 'RESPOND_REQUEST',
            message: `Request ${id} answered`, correlationId,
            details: { id, adminId }
        });

        return { success: true };
    }
}
