"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Activity, ShieldAlert, Zap, Thermometer, ShieldCheck, Cpu, Code } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useUXStore } from "@/store/ux-store";

import { HealthData } from "@/services/admin/dashboard-service";

interface OperationalPulseCardProps {
    health: HealthData;
}

/**
 * Block 2: Operational Pulse (NE)
 * Industrial "Traffic Light" showing ingest health, latency, and security audit.
 */
export const OperationalPulseCard: React.FC<OperationalPulseCardProps> = ({ health }) => {
    const t = useTranslations('admin_analytics');
    const { expertMode } = useUXStore();

    const status = health?.status || 'HEALTHY';
    const ingestRate = health?.ingestSuccessRate ?? 100;
    const ragLatency = health?.avgRagLatency ?? 0;
    const anomalies = health?.securityAnomaliesCount ?? 0;

    const statusConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
        HEALTHY: {
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-l-emerald-500',
            icon: <ShieldCheck className="text-emerald-500" />,
            label: t('commandCenter.pulse.vitals.healthy')
        },
        WARNING: {
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            border: 'border-l-amber-500',
            icon: <Thermometer className="text-amber-500" />,
            label: t('commandCenter.pulse.vitals.warning')
        },
        CRITICAL: {
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-l-rose-500',
            icon: <ShieldAlert className="text-rose-500" />,
            label: t('commandCenter.pulse.vitals.critical')
        }
    };

    const currentStatus = statusConfig[status] || statusConfig.HEALTHY;

    return (
        <ContentCard
            title={t('commandCenter.pulse.title')}
            icon={<Activity className="text-rose-500" size={18} />}
            className={`h-full border-l-4 ${currentStatus.border} shadow-lg hover:shadow-xl transition-all`}
        >
            <div className="flex flex-col h-full justify-between gap-4 p-1">
                <div className={`p-4 rounded-xl ${currentStatus.bg} flex items-center justify-between shadow-sm`}>
                    <div className="flex items-center gap-3">
                        {currentStatus.icon}
                        <span className={`text-xs font-black ${currentStatus.color}`}>
                            {currentStatus.label}
                        </span>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse ml-auto" />
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <Zap size={16} className="text-amber-500" />
                            <span className="text-xs font-medium text-muted-foreground">{t('commandCenter.pulse.ingest')}</span>
                        </div>
                        <span className="text-sm font-black font-mono">{ingestRate}%</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <Activity size={16} className="text-blue-500" />
                            <span className="text-xs font-medium text-muted-foreground">{t('commandCenter.pulse.latency')}</span>
                        </div>
                        <span className="text-sm font-black font-mono">{ragLatency}ms</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <ShieldAlert size={16} className="text-rose-500" />
                            <span className="text-xs font-medium text-muted-foreground">{t('commandCenter.pulse.audit')}</span>
                        </div>
                        <span className="text-sm font-black font-mono text-rose-500">{anomalies}</span>
                    </div>
                </div>

                <Link
                    href="/insights/audit"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                >
                    {t('commandCenter.pulse.discoveryBtn')}
                </Link>
            </div>

            {/* Expert Metadata - Phase 262.2 */}
            {expertMode && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-20 p-6 flex flex-col justify-center animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-4 text-emerald-400 border-b border-emerald-500/20 pb-2">
                        <Code size={16} />
                        <span className="text-xs font-bold">{t('commandCenter.expert.network_trace')}</span>
                    </div>
                    <div className="space-y-2 font-mono text-[10px]">
                        <div className="flex justify-between">
                            <span className="text-slate-500">{t('commandCenter.expert.ingest_sla')}:</span>
                            <span className="text-emerald-400">{health?.ingestSlaScore || "99.9%"}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">RAG_P95:</span>
                            <span className="text-blue-400 font-bold">{ragLatency}ms</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">{t('commandCenter.expert.workers')}:</span>
                            <span className="text-amber-400">{health?.activeWorkers || 0} (BullMQ)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">{t('commandCenter.expert.dlq')}:</span>
                            <span className="text-rose-400">{health?.dlqSize || 0}</span>
                        </div>
                    </div>
                    <button className="mt-6 text-[9px] font-bold text-slate-500 hover:text-white transition-colors">
                        {t('commandCenter.expert.analyze_latency')}
                    </button>
                </div>
            )}
        </ContentCard>
    );
};
