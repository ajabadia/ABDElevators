import { BaseRepository } from './BaseRepository';
import { DocumentTypeSchema, type DocumentType } from '@/lib/schemas';
import { type TenantSession } from '@/lib/db-tenant';
import { EntityId } from '@/lib/schemas/common';

/**
 * 📚 DocumentTypeRepository
 * Repositorio para la gestión de tipos de documentos.
 * Hardened Era 12: Repository-based access.
 */
export class DocumentTypeRepository extends BaseRepository<DocumentType> {
    constructor() {
        super('document_types');
    }

    /**
     * Verifica si un tipo de documento está siendo usado por algún KnowledgeAsset.
     */
    async isUsedByAssets(documentTypeId: EntityId, session?: TenantSession | null): Promise<boolean> {
        const kaCollection = await this.getCollection(session, 'knowledge_assets');
        const count = await kaCollection.countDocuments({ documentTypeId: documentTypeId as any });
        return count > 0;
    }

    /**
     * Sobrescribe el borrado para incluir protección contra uso.
     */
    async deleteWithTypeCheck(id: EntityId, session?: TenantSession | null): Promise<boolean> {
        const inUse = await this.isUsedByAssets(id, session);
        if (inUse) {
            throw new Error('DOCUMENT_TYPE_IN_USE');
        }
        return await this.delete(id, session);
    }
}

export const documentTypeRepository = new DocumentTypeRepository();
