import { IAuditRepository, IngestAudit } from '../../domain/repositories/IAuditRepository';
import { IngestAuditSchema } from '@/lib/schemas';
import { getTenantCollection } from '@/lib/db-tenant';

export class MongoAuditRepository implements IAuditRepository {
    private collectionName = 'audit_ingestion';

    private async getCollection() {
        return await getTenantCollection<any>(this.collectionName);
    }

    async save(log: any) {
        const collection = await getTenantCollection('audit_trails', { user: { id: 'system', tenantId: log.tenantId, role: 'SYSTEM' } } as any);
        return await collection.insertOne(log);
    }

    async logAction(action: any): Promise<void> {
        await this.save({ ...action, timestamp: new Date() });
    }

    async logIngestion(details: any): Promise<void> {
        const collection = await this.getCollection();
        const validated = IngestAuditSchema.parse(details);
        await collection.insertOne({
            ...validated as any,
            timestamp: validated.timestamp || new Date()
        });
    }

    async getIngestionAudit(docId: string): Promise<IngestAudit | null> {
        const collection = await this.getCollection();
        const doc = await collection.findOne({ docId: docId as any });
        if (!doc) return null;
        return IngestAuditSchema.parse(doc);
    }

    async listIngestionAudits(tenantId: string, limit: number = 50): Promise<IngestAudit[]> {
        const collection = await this.getCollection();
        const docs = await collection.find(
            { tenantId } as any,
            { sort: { timestamp: -1 }, limit } as any
        );

        return docs.map((doc: any) => IngestAuditSchema.parse(doc));
    }

    async listLogs(filters: import('../../domain/repositories/IAuditRepository').AuditLogFilters): Promise<{ logs: any[]; errorCount: number; warnCount: number }> {
        // Use 'application_logs' to match logger.ts - This connects to LOGS cluster if configured
        const collection = await getTenantCollection('application_logs', null, 'LOGS', { softDeletes: false });

        const query: any = {};

        if (filters.tenantId) query.tenantId = filters.tenantId;
        if (filters.level && filters.level !== 'ALL') query.level = filters.level;
        if (filters.source) query.source = { $regex: escapeRegExp(filters.source), $options: 'i' };
        if (filters.userEmail) query.userEmail = { $regex: escapeRegExp(filters.userEmail), $options: 'i' };

        if (filters.search) {
            const sanitizedSearch = escapeRegExp(filters.search);
            query.$or = [
                { message: { $regex: sanitizedSearch, $options: 'i' } },
                { action: { $regex: sanitizedSearch, $options: 'i' } },
                { correlationId: { $regex: sanitizedSearch, $options: 'i' } },
                { userEmail: { $regex: sanitizedSearch, $options: 'i' } }
            ];
        }

        if (filters.startTime || filters.endTime) {
            query.timestamp = {};
            if (filters.startTime) query.timestamp.$gte = filters.startTime;
            if (filters.endTime) query.timestamp.$lte = filters.endTime;
        }

        const logs = await collection
            .find(query, {
                sort: { timestamp: -1 } as any,
                limit: filters.limit || 100
            });

        // Fast stats
        const errorCount = await collection.countDocuments({ ...query, level: 'ERROR' });
        const warnCount = await collection.countDocuments({ ...query, level: 'WARN' });

        return { logs, errorCount, warnCount };
    }
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
