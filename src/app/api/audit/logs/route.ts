import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { AuditLogQuerySchema } from '@/lib/schemas/audit-logs';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/audit/logs
 * Permite a los administradores consultar el historial de auditoría de su tenant.
 * SLA: P95 < 2000ms
 */
async function GET_internal(request: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_AUDIT_LOGS', action: 'QUERY' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('audit:logs', 'read');
                const { searchParams } = new URL(request.url);

                // 🛡️ Regla de Oro #2: Validación Zod ANTES de procesar
                const validated = AuditLogQuerySchema.parse(
                    Object.fromEntries(searchParams.entries())
                );
                
                const { limit, search, level, source, type, correlationId: filterCorrelationId } = validated;

                await log({
                    message: `Audit query initiated: type=${type}, limit=${limit}`,
                    details: { type, level, source },
                    tenantId: session.user.tenantId
                });

                // Map unified 'type' to collection names
                const collectionMap: Record<string, string[]> = {
                    'APPLICATION': ['application_logs'],
                    'CONFIG': ['audit_config_changes'],
                    'ADMIN': ['audit_admin_ops'],
                    'ACCESS': ['audit_data_access'],
                    'SECURITY': ['audit_security_events'],
                    'ALL': ['application_logs', 'audit_config_changes', 'audit_admin_ops', 'audit_data_access', 'audit_security_events']
                };

                const targetCollections = collectionMap[type] || ['application_logs'];
                let allLogs: any[] = [];

                for (const colName of targetCollections) {
                    const collection = await getTenantCollection<any>(colName, session, 'LOGS');

                    const query: any = {};
                    if (level !== 'ALL' && colName === 'application_logs') query.level = level;
                    if (source !== 'ALL') query.source = source;
                    if (filterCorrelationId) query.correlationId = filterCorrelationId;

                    if (search) {
                        query.$or = [
                            { message: { $regex: search, $options: 'i' } },
                            { action: { $regex: search, $options: 'i' } },
                            { userEmail: { $regex: search, $options: 'i' } },
                            { actorId: { $regex: search, $options: 'i' } }
                        ];
                    }

                    const logs = await collection.find(query, {
                        sort: { timestamp: -1 },
                        limit
                    });

                    const normalized = logs.map(l => ({
                        ...l,
                        _originalCollection: colName,
                        level: l.level || (colName.includes('security') ? 'WARN' : 'INFO')
                    }));

                    allLogs = [...allLogs, ...normalized];
                }

                // Sort and Slice for proper pagination/limit across collections
                allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                const limitedLogs = allLogs.slice(0, limit);

                await log({
                    message: 'Audit logs query successful',
                    details: { count: limitedLogs.length },
                    tenantId: session.user.tenantId
                });

                return NextResponse.json({
                    success: true,
                    data: limitedLogs,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_AUDIT_LOGS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/audit/logs', thresholdMs: 2000 });
