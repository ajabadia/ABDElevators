import { GenericCase } from '@/lib/schemas';

export interface ICaseRepository {
    findById(id: string, tenantId: string): Promise<GenericCase | null>;
    updateStatus(id: string, status: string, historyEntry: any, tenantId: string): Promise<void>;
    update(id: string, updates: Partial<GenericCase>, tenantId: string): Promise<void>;
}
