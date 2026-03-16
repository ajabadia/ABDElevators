import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { MongoSanitizer } from '@/lib/mongo-sanitizer';
import { requireRole } from '@/lib/api-auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

const API_SOURCE = 'API_ADMIN_LOGS';

/**
 * GET /api/admin/logs
 * Retrieves application logs with advanced filtering.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: API_SOURCE, action: 'FETCH_LOGS' },
        async ({ log, correlationId }) => {
            try {
                // 🛡️ Defense in Depth (Phase 284)
                const session = await requireRole(['ADMIN', 'SUPER_ADMIN']);
                // Phase 70: Centralized typed role check
                await requirePermission('audit:logs', 'read');

                const { searchParams } = new URL(req.url);
                const limit = parseInt(searchParams.get('limit') || '100');

                // 🛡️ SECURITY: Sanitize all string inputs to prevent NoSQL operator injection in query building
                const rawSearch = searchParams.get('search') || '';
                const rawLevel = searchParams.get('level') || searchParams.get('nivel') || '';
                const rawSource = searchParams.get('source') || searchParams.get('origen') || '';
                const rawTenantIdFilter = searchParams.get('tenantId') || '';
                const rawUserEmail = searchParams.get('userEmail') || '';
                const loadAll = searchParams.get('all') === 'true';

                // Proactive Sanitization (Phase 270)
                const search = MongoSanitizer.sanitize(rawSearch);
                const level = MongoSanitizer.sanitize(rawLevel);
                const source = MongoSanitizer.sanitize(rawSource);
                const tenantIdFilter = MongoSanitizer.sanitize(rawTenantIdFilter);
                const userEmail = MongoSanitizer.sanitize(rawUserEmail);

                // 🛡️ Lazy Loading Guard: If no active filters AND not requesting "all", return empty
                const hasActiveFilters = level || source || search || userEmail || tenantIdFilter || loadAll;
                if (!hasActiveFilters) {
                    return NextResponse.json({
                        success: true,
                        logs: [],
                        meta: { errorCount: 0, warnCount: 0 },
                        info: 'No filters applied. Use search, level, or source parameters to load logs.',
                        correlationId
                    });
                }


                // Shielded LOGS database context
                // Use 'application_logs' to match logger.ts
                const logColl = await getTenantCollection('application_logs', session, 'LOGS');

                const query: any = {};

                // If SuperAdmin and wants to filter by a specific tenant
                if (session.user.role === UserRole.SUPER_ADMIN && tenantIdFilter) {
                    query.tenantId = tenantIdFilter;
                }
                // If ADMIN and wants to filter within their own tenants
                else if (session.user.role === UserRole.ADMIN && tenantIdFilter) {
                    query.tenantId = tenantIdFilter;
                }

                if (level && level !== 'ALL') query.level = level;
                if (source) query.source = { $regex: MongoSanitizer.escapeRegExp(source), $options: 'i' };
                if (userEmail) query.userEmail = { $regex: MongoSanitizer.escapeRegExp(userEmail), $options: 'i' };

                if (search) {
                    const sanitizedSearch = MongoSanitizer.escapeRegExp(search);
                    query.$or = [
                        { message: { $regex: sanitizedSearch, $options: 'i' } },
                        { action: { $regex: sanitizedSearch, $options: 'i' } },
                        { correlationId: { $regex: sanitizedSearch, $options: 'i' } },
                        { userEmail: { $regex: sanitizedSearch, $options: 'i' } }
                    ];
                }

                const logs = await logColl
                    .find(query, {
                        sort: { timestamp: -1 } as any,
                        limit: limit
                    });

                // Fast stats for header
                const [errorCount, warnCount] = await Promise.all([
                    logColl.countDocuments({ ...query, level: 'ERROR' }),
                    logColl.countDocuments({ ...query, level: 'WARN' })
                ]);

                return NextResponse.json({
                    success: true,
                    logs,
                    meta: { errorCount, warnCount },
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, API_SOURCE, correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/logs', thresholdMs: 500 });
