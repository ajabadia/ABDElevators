import { ContactRequestSchema, ContactRequest } from '@/lib/schemas';
import { contactRepository } from '@/lib/repositories/ContactRepository';
import { ObjectId } from 'mongodb';
import { AppError } from '@/lib/errors';
import { EntityId, TenantId } from '@/lib/schemas/common';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { getSystemSession } from '@/lib/sessions/system-session';

/**
 * Contact and Support Service (Vision 2.0 - Phase 10)
 */
export class ContactService {
    /**
     * Creates a new contact request.
     */
    static async createRequest(data: Partial<ContactRequest>, tenantId: TenantId) {
        return withCorrelation({ level: 'INFO', source: 'CONTACT_SERVICE', action: 'CREATE_REQUEST', tenantId }, async ({ log, correlationId }) => {
            const validated = ContactRequestSchema.parse({
                ...data,
                tenantId,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'pending'
            });

            const insertedId = await contactRepository.create(validated, getSystemSession(tenantId));

            await log({
                message: `New contact request from ${validated.email}`,
                details: { id: insertedId, email: validated.email }
            });

            return { insertedId };
        });
    }

    /**
     * Lists all requests (Only for SUPER_ADMIN or Global ADMIN).
     */
    static async listAll(tenantId?: TenantId) {
        return await contactRepository.find(tenantId ? { tenantId } : {}, { sort: { createdAt: -1 } as any });
    }

    /**
     * Responds to a request.
     */
    static async respondRequest(id: string, answer: string, adminId: string, tenantId: TenantId) {
        return withCorrelation({ level: 'INFO', source: 'CONTACT_SERVICE', action: 'RESPOND_REQUEST', tenantId }, async ({ log, correlationId }) => {
            const success = await contactRepository.update(id, {
                $set: {
                    answer,
                    answeredBy: adminId as EntityId,
                    status: 'resolved',
                    updatedAt: new Date()
                }
            } as any);

            if (!success) {
                throw new AppError('NOT_FOUND', 404, 'Request not found');
            }

            await log({
                message: `Request ${id} answered`,
                details: { id, adminId }
            });

            return { success: true };
        });
    }
}
