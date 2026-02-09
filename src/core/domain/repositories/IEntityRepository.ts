import { Entity } from '@/lib/schemas';

export interface IEntityRepository {
    findById(id: string, tenantId: string): Promise<Entity | null>;
    updateResult(id: string, results: Partial<Entity>): Promise<void>;
}
