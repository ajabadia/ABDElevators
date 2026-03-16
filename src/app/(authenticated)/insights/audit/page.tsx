import { requirePermission } from '@/lib/auth';
import { AuditClient } from "./AuditClient";
import { ObservabilityRepository } from '@/services/observability/ObservabilityRepository';
import { AppEvent } from '@/services/observability/schemas/EventSchema';
import { FeatureShell } from '@/components/shared/FeatureShell';
import { ShieldCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

function transformAppEventToLogEntry(event: AppEvent): LogEntry {
    return {
        _id: event._id || '',
        level: event.level,
        source: event.source,
        action: event.action,
        message: event.message,
        correlationId: event.correlationId,
        tenantId: event.tenantId,
        timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : String(event.timestamp),
        durationMs: event.durationMs
    };
}

interface LogEntry {
    _id: string;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    source: string;
    action: string;
    message: string;
    correlationId?: string;
    tenantId?: string;
    timestamp: string;
    durationMs?: number;
}

/**
 * 🔍 Registro de Auditoría (Server Component - Phase 430)
 * Pre-fetches audit data to eliminate client-side waterfalls.
 */
export default async function AuditoriaPage() {
    await requirePermission('admin:audit', 'read');
    const t = await getTranslations('admin_logs');

    // Pre-fetch initial stats and last 50 logs for instant load
    const [globalStats, logStats, initialLogs] = await Promise.all([
        ObservabilityRepository.getGlobalStats(),
        ObservabilityRepository.getLogStats(),
        ObservabilityRepository.getLogs({ limit: 50 })
    ]);

    const transformedLogs: LogEntry[] = (initialLogs || []).map(transformAppEventToLogEntry);

    return (
        <FeatureShell
            title={t('title')}
            subtitle="Explorador de observabilidad de alta densidad con carga instantánea."
            icon={<ShieldCheck className="h-6 w-6 text-primary" />}
        >
            <AuditClient 
                initialGlobalStats={globalStats}
                initialLogStats={logStats}
                initialLogs={transformedLogs}
            />
        </FeatureShell>
    );
}
