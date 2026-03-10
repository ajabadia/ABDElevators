import { BaseRepository } from './BaseRepository';
import { type Space } from '@/lib/schemas/spaces';
import { type Filter } from 'mongodb';
import { type TenantSession } from '@/lib/db-tenant';

/**
 * 🏛️ SpaceRepository
 * Repositorio para la gestión de espacios jerárquicos.
 * Cluster: MAIN
 */
export class SpaceRepository extends BaseRepository<Space> {
    constructor() {
        super('spaces');
    }

    /**
     * Busca un espacio por su ruta materializada (SpacePath).
     */
    async findByPath(path: string, tenantId: string, session?: TenantSession): Promise<Space | null> {
        return await this.findOne({
            materializedPath: path,
            tenantId,
            isActive: true
        } as unknown as Filter<Space>, {}, session);
    }
}

export const spaceRepository = new SpaceRepository();
