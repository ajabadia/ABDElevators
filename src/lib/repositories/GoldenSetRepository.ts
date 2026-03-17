import { BaseRepository } from './BaseRepository';
import { GoldenSetSchema, type GoldenSet } from '@/lib/schemas/rag-quality';
import { type ClientSession } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';
import { EntityId } from '@/lib/schemas/common';

export class GoldenSetRepository extends BaseRepository<GoldenSet> {
    constructor() {
        super('golden_sets');
    }

    async create(data: Omit<GoldenSet, '_id'>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<EntityId> {
        // Hardened validation (Isla 2)
        await Promise.all([
            data.spaceId ? this.validateExists('spaces', data.spaceId, session, mongoSession) : Promise.resolve(),
            data.documentTypeId ? this.validateExists('document_types', data.documentTypeId, session, mongoSession) : Promise.resolve()
        ]);

        const validated = GoldenSetSchema.parse(data);
        return await super.create(validated, session, mongoSession);
    }
}

export const goldenSetRepository = new GoldenSetRepository();
