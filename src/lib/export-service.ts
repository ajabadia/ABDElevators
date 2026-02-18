import Papa from 'papaparse';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { ExportParams, ExportType } from '@/lib/schemas/export';
import { AppError } from '@/lib/errors';
import { Filter } from 'mongodb';

/**
 * Servicio encargado de la exportación universal de datos.
 * Soporta CSV y JSON con filtrado multi-tenant.
 */
export class ExportService {
    /**
     * Mapeo de tipos de exportación a nombres de colecciones.
     */
    private static readonly TYPE_TO_COLLECTION: Record<ExportType, string> = {
        usage_logs: 'usage_logs',
        audit_logs: 'audit_config_changes', // Ajustar según convención de logs
        knowledge_assets: 'knowledge_assets',
        tenants: 'tenants',
    };

    /**
   * Genera un stream de datos formateados.
   */
    static async *exportDataStream(params: ExportParams, session: TenantSession) {
        const { type, format, from, to, tenantId, limit, offset } = params;

        const isAdmin = session.user?.role === 'SUPER_ADMIN';
        const effectiveTenantId = isAdmin ? tenantId : session.user?.tenantId;

        const collectionName = this.TYPE_TO_COLLECTION[type];
        if (!collectionName) {
            throw new AppError('VALIDATION_ERROR', 400, `Tipo de exportación '${type}' no soportado`);
        }

        const filter: Filter<any> = {};
        if (effectiveTenantId && collectionName !== 'tenants') {
            filter.tenantId = effectiveTenantId;
        }

        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const dbType = this.getDbTypeForCollection(collectionName);
        const secureCollection = await getTenantCollection(collectionName, session, dbType);

        // Fetch data in chunks if limit is large, or just use find().toArray() for now but yield selectively
        const data = await secureCollection.find(filter, {
            limit,
            skip: offset,
            sort: { createdAt: -1 },
        });

        if (format === 'json') {
            yield JSON.stringify(data, null, 2);
            return;
        }

        // CSV Streaming
        if (data.length === 0) return;

        // Yield headers first
        const firstItem = this.processItem(data[0]);
        const headers = Object.keys(firstItem);
        yield headers.join(',') + '\n';

        // Yield rows
        for (const item of data) {
            const processed = this.processItem(item);
            const row = headers.map(h => {
                const val = processed[h];
                return typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))
                    ? `"${val.replace(/"/g, '""')}"`
                    : val;
            });
            yield row.join(',') + '\n';
        }
    }

    /**
     * Limpia y prepara un item para CSV.
     */
    private static processItem(item: any): any {
        const flat: any = { ...item };
        delete flat._id;
        delete flat.deletedAt;

        Object.keys(flat).forEach(key => {
            if (flat[key] instanceof Date) {
                flat[key] = (flat[key] as Date).toISOString();
            } else if (typeof flat[key] === 'object' && flat[key] !== null) {
                flat[key] = JSON.stringify(flat[key]);
            }
        });
        return flat;
    }

    /**
     * Determina a qué base de datos (MAIN/LOGS/AUTH) pertenece la colección.
     */
    private static getDbTypeForCollection(name: string): 'MAIN' | 'LOGS' | 'AUTH' {
        if (name.includes('logs') || name.includes('audit')) return 'LOGS';
        if (name === 'tenants' || name === 'users') return 'AUTH';
        return 'MAIN';
    }
}
