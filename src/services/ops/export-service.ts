import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { ExportParams, ExportType } from '@/lib/schemas/export';
import { AppError } from '@/lib/errors';
import { Filter } from 'mongodb';
import { CsvStreamBuilder } from '../infra/csv-stream-builder';

export class ExportService {
    private static readonly TYPE_TO_COLLECTION: Record<ExportType, string> = {
        usage_logs: 'usage_logs',
        audit_logs: 'audit_config_changes', // Default audit collection
        knowledge_assets: 'knowledge_assets',
        tenants: 'tenants',
    };

    /**
     * Generates a stream of formatted data (CSV or JSON).
     */
    static async *getExportStream(params: ExportParams, session: TenantSession) {
        const { type, format, from, to, tenantId, limit, offset } = params;
        const isAdmin = session.user?.role === 'SUPER_ADMIN';
        const effectiveTenantId = isAdmin ? tenantId : session.user?.tenantId;

        const collectionName = this.TYPE_TO_COLLECTION[type];
        if (!collectionName) throw new AppError('VALIDATION_ERROR', 400, `Type '${type}' not supported`);

        const filter: Filter<any> = {};
        if (effectiveTenantId && collectionName !== 'tenants') filter.tenantId = effectiveTenantId;

        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const dbType = this.getDbType(collectionName);
        const collection = await getTenantCollection(collectionName, session, dbType);

        const data = await collection.find(filter, {
            limit,
            skip: offset,
            sort: { createdAt: -1 },
        });

        if (format === 'json') {
            yield JSON.stringify(data, null, 2);
            return;
        }

        // CSV formatting delegated to Infra
        if (data.length === 0) return;

        const flattened = data.map((item: any) => CsvStreamBuilder.flattenObject(item));
        const firstItem = flattened[0];
        const headers = Object.keys(firstItem);
        yield headers.join(',') + '\n';

        for (const item of flattened) {
            const row = headers.map(h => {
                const val = item[h];
                if (val === null || val === undefined) return '';
                const str = String(val).replace(/"/g, '""');
                return str.includes(',') || str.includes('\n') ? `"${str}"` : str;
            });
            yield row.join(',') + '\n';
        }
    }

    private static getDbType(name: string): 'MAIN' | 'LOGS' | 'AUTH' {
        if (name.includes('logs') || name.startsWith('audit_')) return 'LOGS';
        if (name === 'tenants' || name === 'users') return 'AUTH';
        return 'MAIN';
    }
}
