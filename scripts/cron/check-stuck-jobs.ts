/**
 * Cron Job: Detect and Recover Stuck Ingestion Jobs
 * 
 * Run this script every 5 minutes via:
 * - Vercel Cron (vercel.json)
 * - GitHub Actions
 * - System cron (crontab)
 * 
 * Usage:
 *   npx tsx scripts/cron/check-stuck-jobs.ts
 */

import { StuckDetector } from '@/services/ingest/recovery/StuckDetector';
import { logEvento } from '@/lib/logger';

async function main() {
    const correlationId = `cron-stuck-check-${Date.now()}`;

    try {
        await logEvento({
            level: 'INFO',
            source: 'CRON',
            action: 'STUCK_CHECK_START',
            message: 'Starting periodic stuck job detection',
            correlationId,
            tenantId: 'platform_master',
            details: { timestamp: new Date().toISOString() }
        });

        // Run stuck job detection and recovery
        const result = await StuckDetector.recoverStuckJobs();

        await logEvento({
            level: result.recovered > 0 ? 'WARN' : 'INFO',
            source: 'CRON',
            action: 'STUCK_CHECK_COMPLETE',
            message: `Stuck job check complete: ${result.recovered} jobs recovered`,
            correlationId,
            tenantId: 'platform_master',
            details: {
                recovered: result.recovered,
                errors: result.errors,
                timestamp: new Date().toISOString()
            }
        });

        // Alert if many stuck jobs detected
        if (result.recovered > 10) {
            console.warn(`⚠️ HIGH VOLUME OF STUCK JOBS: ${result.recovered} jobs recovered`);
            // TODO: Send email/Slack alert to admins
        }

        process.exit(0);
    } catch (error: any) {
        console.error('[CRON ERROR] Stuck job detection failed:', error);

        await logEvento({
            level: 'ERROR',
            source: 'CRON',
            action: 'STUCK_CHECK_FAILED',
            message: `Stuck job check failed: ${error.message}`,
            correlationId,
            tenantId: 'platform_master',
            details: {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            }
        });

        process.exit(1);
    }
}

main();
