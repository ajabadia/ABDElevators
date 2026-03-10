import { BaseRepository } from './BaseRepository';
import { DocumentSectionSchema, type DocumentSection } from '@/lib/schemas';
import { type ClientSession } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';

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
    async create(data: Omit<DocumentSection, '_id'>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<string> {
        const validated = DocumentSectionSchema.parse(data);
        return await super.create(validated as any, session, mongoSession);
    }

    /**
     * Busca secciones por assetId ordenadas.
     */
    async findByAssetId(assetId: string, session?: TenantSession | null): Promise<DocumentSection[]> {
        return await this.list({ assetId } as any, { sort: { order: 1 } }, session);
    }
}

export const documentSectionRepository = new DocumentSectionRepository();
