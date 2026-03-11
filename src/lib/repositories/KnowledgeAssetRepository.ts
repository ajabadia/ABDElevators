import { BaseRepository } from './BaseRepository';
import { KnowledgeAssetSchema, type KnowledgeAsset } from '@/lib/schemas/assets';
import { ObjectId, type ClientSession, type Filter } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';
import { EntityId, TenantId } from '@/lib/schemas/common';
import { AppError } from '@/lib/errors';

/**
 * 🏛️ KnowledgeAssetRepository
 * Repositorio centralizado para activos de conocimiento.
 * Standardized for Era 12 (Hardened relational integrity).
 */
export class KnowledgeAssetRepository extends BaseRepository<KnowledgeAsset> {
    constructor() {
        super('knowledge_assets'); // Standardized naming
    }

    /**
     * Reemplaza create para añadir validación de esquema y FKs.
     */
    async create(data: Omit<KnowledgeAsset, '_id'>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<EntityId> {
        // 1. Validar FKs (Relational Hardening)
        const tenantId = session?.user?.tenantId;
        await Promise.all([
            this.validateExists('spaces', data.spaceId, session, mongoSession),
            this.validateExists('document_types', data.documentTypeId, session, mongoSession),
            this.validateExists('users', data.ownerId, session, mongoSession)
        ]);

        const validated = KnowledgeAssetSchema.parse(data);
        return await super.create(validated as any, session, mongoSession);
    }

    /**
     * Reemplaza update para permitir re-validación de FKs si cambian.
     */
    async update(
        id: EntityId | ObjectId | string,
        patch: Partial<KnowledgeAsset>,
        session?: TenantSession | null,
        mongoSession?: ClientSession
    ): Promise<boolean> {
        // Si el patch incluye cambios en FKs, revalidamos
        if (patch.spaceId) await this.validateExists('spaces', patch.spaceId, session, mongoSession);
        if (patch.documentTypeId) await this.validateExists('document_types', patch.documentTypeId, session, mongoSession);
        if (patch.ownerId) await this.validateExists('users', patch.ownerId, session, mongoSession);

        const existing = await this.getEntity(id, session, mongoSession);
        const merged = KnowledgeAssetSchema.parse({
            ...existing,
            ...patch,
            updatedAt: new Date(),
            version: (existing.version || 1) + 1
        });

        return await super.update(id, { $set: merged } as any, session, mongoSession);
    }

    /**
     * Busca por criterios de deduplicación.
     */
    async findForDeduplication(query: Filter<KnowledgeAsset>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<KnowledgeAsset | null> {
        return await this.findOne(query, session, mongoSession);
    }

    /**
     * High-performance hierarchical listing by space path prefix.
     */
    async findBySpacePathPrefix(pathPrefix: string, session?: TenantSession | null): Promise<KnowledgeAsset[]> {
        return await this.list({
            spacePath: { $regex: `^${pathPrefix}` }
        } as any, {}, session);
    }
}

export const knowledgeAssetRepository = new KnowledgeAssetRepository();
