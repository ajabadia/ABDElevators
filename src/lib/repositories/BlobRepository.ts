import { BaseRepository } from './BaseRepository';
import { FileBlob } from '@/lib/schemas/blob';
import { TenantSession } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';

/**
 * 🏛️ BlobRepository
 * Repositorio para la gestión del registro global de blobs.
 * 🚨 Nota: Los blobs son globales (tenantId: '0000...'), pero este repo
 * soporta aislamiento por si en el futuro se requieren blobs privados.
 */
export class BlobRepository extends BaseRepository<FileBlob> {
    constructor() {
        super('file_blobs', 'MAIN');
    }

    /**
     * Busca un blob por su MD5 (que es el _id).
     */
    async findByMd5(md5: string, session?: TenantSession): Promise<FileBlob | null> {
        return await this.findOne({ _id: md5 as any }, session);
    }

    /**
     * Incrementa el contador de referencias de un blob de forma atómica.
     */
    async incrementRefCount(md5: string, session?: TenantSession): Promise<FileBlob | null> {
        const collection = await this.getCollection(session);
        const result = await collection.findOneAndUpdate(
            { _id: md5 as any },
            { 
                $inc: { refCount: 1 },
                $set: { lastSeenAt: new Date() }
            },
            { returnDocument: 'after', session: session?.session }
        );

        // Normalize driver return (value or document)
        return (result as any).value || result;
    }

    /**
     * Decrementa el contador de referencias.
     */
    async decrementRefCount(md5: string, session?: TenantSession): Promise<void> {
        await this.update(md5, { $inc: { refCount: -1 } } as any, session);
    }

    /**
     * Busca blobs huérfanos.
     */
    async findOrphaned(session?: TenantSession): Promise<FileBlob[]> {
        return await this.list({ refCount: 0 }, { limit: 100 }, session);
    }
}

export const blobRepository = new BlobRepository();
