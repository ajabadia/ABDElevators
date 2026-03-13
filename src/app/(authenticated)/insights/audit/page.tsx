import { requirePermission } from '@/lib/auth';
import { AuditClient } from "./AuditClient";
import { ObservabilityRepository } from '@/services/observability/ObservabilityRepository';

/**
 * 🔍 Registro de Auditoría (Server Component - Phase 430)
 * Pre-fetches audit data to eliminate client-side waterfalls.
 */
export default async function AuditoriaPage() {
    await requirePermission('admin:audit', 'read');

    // Pre-fetch initial stats and last 50 logs for instant load
    // Using default limit of 50 for the first view
    const [globalStats, logStats, initialLogs] = await Promise.all([
        ObservabilityRepository.getGlobalStats(),
        ObservabilityRepository.getLogStats(),
        ObservabilityRepository.getLogs({ limit: 50 })
    ]);

    return (
        <AuditClient 
            initialGlobalStats={globalStats as any}
            initialLogStats={logStats}
            initialLogs={initialLogs as any}
        />
    );
}
