import { goldenSetRepository } from '@/lib/repositories/GoldenSetRepository';
import { RagGoldenSetSchema, type RagGoldenSet } from '@/lib/schemas';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { type TenantSession } from '@/lib/db-tenant';
import { UserRole } from '@/types/roles';
import crypto from 'node:crypto';

/**
 * 🎯 RagGoldenSetService
 * Phase 310: Management of RAG test collections (Golden Sets).
 */
export class RagGoldenSetService {
    /**
     * Adds a new query to a golden set.
     */
    static async addEntry(entry: Partial<RagGoldenSet>, tenantId: string, createdBy: string = 'system') {
        const correlationId = crypto.randomUUID();
        const tId = TenantIdSchema.parse(tenantId);

        const validated = RagGoldenSetSchema.parse({
            ...entry,
            tenantId: tId,
            createdBy: EntityIdSchema.parse(createdBy === 'system' ? '000000000000000000000000' : createdBy),
            createdAt: new Date()
        });

        const session: TenantSession = {
            user: {
                id: validated.createdBy as any,
                tenantId: tId,
                role: UserRole.SUPER_ADMIN
            }
        };

        const result = await goldenSetRepository.create(validated as any, session);

        await logEvento({
            level: 'INFO',
            source: 'GOLDEN_SET_SERVICE',
            action: 'ENTRY_ADDED',
            message: `New golden set entry added for tenant ${tenantId}`,
            tenantId,
            correlationId,
            details: { query: validated.query, entryId: result }
        });

        return result;
    }

    /**
     * Lists queries for a specific flow and tenant.
     */
    static async listEntries(tenantId: string, flowType?: string): Promise<RagGoldenSet[]> {
        const tId = TenantIdSchema.parse(tenantId);
        const session: TenantSession = {
            user: {
                id: EntityIdSchema.parse('000000000000000000000000'),
                tenantId: tId,
                role: UserRole.SUPER_ADMIN
            }
        };
        const filter: any = {};
        if (flowType) filter.flowType = flowType;

        return await goldenSetRepository.list(filter, { sort: { createdAt: -1 } }, session);
    }

    /**
     * Bulk imports a collection of golden set entries.
     */
    static async bulkImport(entries: Partial<RagGoldenSet>[], tenantId: string, createdBy: string = 'system') {
        const correlationId = crypto.randomUUID();
        const tId = TenantIdSchema.parse(tenantId);
        const session: TenantSession = {
            user: {
                id: EntityIdSchema.parse(createdBy === 'system' ? '000000000000000000000000' : createdBy),
                tenantId: tId,
                role: UserRole.SUPER_ADMIN
            }
        };

        const validatedEntries = entries.map(e => {
            return RagGoldenSetSchema.parse({
                ...e,
                tenantId: tId,
                createdBy: session.user?.id,
                createdAt: new Date()
            });
        });

        const result = await goldenSetRepository.bulkWrite(validatedEntries.map(e => ({
            insertOne: { document: e as any }
        })), session);

        await logEvento({
            level: 'INFO',
            source: 'GOLDEN_SET_SERVICE',
            action: 'BULK_IMPORT',
            message: `Imported ${result.insertedCount} golden set entries for tenant ${tenantId}`,
            tenantId,
            correlationId,
            details: { count: result.insertedCount }
        });

        return result.insertedIds;
    }

    /**
     * Deletes an entry from a golden set.
     */
    static async deleteEntry(id: string, tenantId: string) {
        const tId = TenantIdSchema.parse(tenantId);
        const session: TenantSession = {
            user: {
                id: EntityIdSchema.parse('000000000000000000000000'),
                tenantId: tId,
                role: UserRole.SUPER_ADMIN
            }
        };

        const result = await goldenSetRepository.deleteEntity(id, session, true);

        if (!result) {
            throw new AppError('NOT_FOUND', 404, 'Golden set entry not found');
        }

        return true;
    }
}
