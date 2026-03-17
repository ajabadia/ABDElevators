import { BaseRepository, type SafeFilter } from './BaseRepository';
import { DocumentSectionSchema, type DocumentSection } from '@/lib/schemas';
import { type ClientSession } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';
import { EntityId } from '@/lib/schemas/common';

/**
 * 🏛️ DocumentSectionRepository
 * Repositorio para secciones de documentos (Era 11).
 */
export class DocumentSectionRepository extends BaseRepository<DocumentSection> {
    constructor() {
        super('document_sections');
    }

    /**
     * Crea una nueva sección validando contra el schema.
     */
    async create(data: Omit<DocumentSection, '_id'>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<EntityId> {
        const validated = DocumentSectionSchema.parse(data);
        return await super.create(validated, session, mongoSession);
    }

    /**
     * Busca secciones por assetId ordenadas.
     */
    async findByAssetId(assetId: string, session?: TenantSession | null): Promise<DocumentSection[]> {
        return await this.list({ assetId } as SafeFilter<DocumentSection>, { sort: { order: 1 } }, session);
    }
}

export const documentSectionRepository = new DocumentSectionRepository();
