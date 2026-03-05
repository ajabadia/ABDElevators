"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Activity, ShieldAlert, Zap, Thermometer, ShieldCheck } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface OperationalPulseCardProps {
    health: any;
}

/**
 * Block 2: Operational Pulse (NE)
 * Industrial "Traffic Light" showing ingest health, latency, and security audit.
 */
export const OperationalPulseCard: React.FC<OperationalPulseCardProps> = ({ health }) => {
    const t = useTranslations('admin_analytics');

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
            label: 'SYSTEM VITAL'
        },
        WARNING: {
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            border: 'border-l-amber-500',
            icon: <Thermometer className="text-amber-500" />,
            label: 'ATTENTION REQ'
        },
        CRITICAL: {
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-l-rose-500',
            icon: <ShieldAlert className="text-rose-500" />,
            label: 'CRITICAL SYSTEM'
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
                <div className={`p-4 rounded-2xl ${currentStatus.bg} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        {currentStatus.icon}
                        <span className={`text-xs font-black tracking-[0.2em] ${currentStatus.color}`}>
                            {currentStatus.label}
                        </span>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-current animate-pulse ml-auto" />
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
                    href="/admin/operations/logs"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                >
                    {t('commandCenter.pulse.discoveryBtn')}
                </Link>
            </div>
        </ContentCard>
    );
};
