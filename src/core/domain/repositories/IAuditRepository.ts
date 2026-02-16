import { IngestAuditSchema } from '@/lib/schemas';
import { z } from 'zod';

export type IngestAudit = z.infer<typeof IngestAuditSchema>;

export interface IAuditRepository {
    logAction(action: any): Promise<void>;
    logIngestion(details: any): Promise<void>;
    getIngestionAudit(docId: string): Promise<IngestAudit | null>;
    listIngestionAudits(tenantId: string, limit?: number): Promise<IngestAudit[]>;
    listLogs(filters: AuditLogFilters): Promise<{ logs: any[]; errorCount: number; warnCount: number }>;
}

export interface AuditLogFilters {
    tenantId?: string;
    limit?: number;
    level?: string;
    source?: string;
    search?: string;
    userEmail?: string;
    startTime?: Date;
    endTime?: Date;
}
