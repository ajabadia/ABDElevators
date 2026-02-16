import { Entity } from '@/lib/schemas';

export interface IEntityRepository {
    findById(id: string, tenantId: string): Promise<Entity | null>;
    updateAnalysisResult(id: string, results: Partial<Entity>): Promise<void>;
}
