import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { PROMPTS } from '@/lib/prompts';

/**
 * 🏛️ Governance Statistics API (Era 18)
 * Provides detailed metrics about prompt parity, health and usage.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_GOVERNANCE_STATS', action: 'GET_STATS' },
        async ({ log, correlationId }) => {
            try {
                // Rule #11: Secure access via Guardian
                await requireSuperAdmin();

                const systemSession = {
                    user: {
                        id: 'system-governance-stats',
                        tenantId: 'platform_master',
                        role: UserRole.SUPER_ADMIN,
                    }
                };

                // 1. Database Prompt Metrics
                const promptsCollection = await getTenantCollection('prompts', systemSession, 'CONFIG');
                
                const stats = await promptsCollection.aggregate([
                    { $match: { tenantId: 'abd_global' } },
                    {
                        $group: {
                            _id: null,
                            total: { $count: {} },
                            active: { $sum: { $cond: ['$active', 1, 0] } },
                            avgVersion: { $avg: '$version' },
                            maxVersion: { $max: '$version' }
                        }
                    }
                ]).toArray();

                const dbStats = stats[0] || { total: 0, active: 0, avgVersion: 0, maxVersion: 0 };

                // 2. Parity Check (Code vs DB)
                const codePromptKeys = Object.keys(PROMPTS);
                const dbPrompts = await promptsCollection.find({ tenantId: 'abd_global' }).toArray();
                const dbKeys = new Set(dbPrompts.map(p => p.key));
                
                const missingInDb = codePromptKeys.filter(k => !dbKeys.has(k));
                const parityScore = codePromptKeys.length > 0 
                    ? ((codePromptKeys.length - missingInDb.length) / codePromptKeys.length) * 100 
                    : 100;

                // 3. Health & Fallbacks (from Audit Logs)
                const auditCollection = await getTenantCollection('audit_trails', systemSession, 'LOGS');
                const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
                
                const fallbackLogs = await auditCollection.countDocuments({
                    action: 'FALLBACK_USED',
                    createdAt: { $gte: last24h }
                });

                const totalCalls = await auditCollection.countDocuments({
                    source: 'PROMPT_SERVICE',
                    createdAt: { $gte: last24h }
                });

                const healthScore = totalCalls > 0 
                    ? Math.max(0, 100 - (fallbackLogs / totalCalls) * 100) 
                    : 100;

                // 4. Recent Changes
                const recentChanges = await promptsCollection.find(
                    { tenantId: 'abd_global' },
                    { sort: { updatedAt: -1 }, limit: 5 }
                ).toArray();

                return NextResponse.json({
                    summary: {
                        totalPrompts: codePromptKeys.length,
                        dbActive: dbStats.active,
                        parity: Number(parityScore.toFixed(1)),
                        health: Number(healthScore.toFixed(1))
                    },
                    details: {
                        avgVersion: Number(dbStats.avgVersion.toFixed(1)),
                        maxVersion: dbStats.maxVersion,
                        missingInDb: missingInDb,
                        fallbacks24h: fallbackLogs
                    },
                    recentChanges: recentChanges.map(p => ({
                        key: p.key,
                        version: p.version,
                        updatedAt: p.updatedAt
                    })),
                    timestamp: new Date(),
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_GOVERNANCE_STATS', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { 
    endpoint: 'GET /api/admin/superadmin/governance/stats', 
    thresholdMs: 1000 
});
