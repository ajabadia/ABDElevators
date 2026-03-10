import { BaseRepository } from './BaseRepository';
import { DocumentProfileSchema, type DocumentProfile } from '@/lib/schemas';
import { type ClientSession } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';

/**
 * 🏛️ DocumentProfileRepository
 * Repositorio para la cabecera semántica de documentos (Era 11).
 */
export class DocumentProfileRepository extends BaseRepository<DocumentProfile> {
    constructor() {
        super('document_profiles');
    }

    /**
     * Crea un nuevo perfil validando contra el schema.
     */
    async create(data: Omit<DocumentProfile, '_id'>, session?: TenantSession | null, mongoSession?: ClientSession): Promise<string> {
        const validated = DocumentProfileSchema.parse(data);
        return await super.create(validated as any, session, mongoSession);
    }

    /**
     * Busca el perfil por assetId.
     */
    async findByAssetId(assetId: string, session?: TenantSession | null): Promise<DocumentProfile | null> {
        const collection = await this.getCollection(session);
        return await collection.findOne({ assetId } as any) as DocumentProfile | null;
    }
}

export const documentProfileRepository = new DocumentProfileRepository();
