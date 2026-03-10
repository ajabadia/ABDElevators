"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Building2, HardDrive, ArrowUpRight, Cpu, Gauge } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUXStore } from "@/store/ux-store";

import { GlobalStats } from "@/services/admin/dashboard-service";

interface IdentityVitalityCardProps {
    stats: GlobalStats;
    isSuperAdmin: boolean;
}

/**
 * Block 1: Identity & Vitality (NW)
 * Shows tenant branding and critical storage "Vitals".
 */
export const IdentityVitalityCard: React.FC<IdentityVitalityCardProps> = ({ stats, isSuperAdmin }) => {
    const t = useTranslations('admin_analytics');
    const { expertMode } = useUXStore();

    const statsAny = stats as any;
    const storageUsage = stats.usage?.storage || 0;
    const storageLimit = statsAny.limits?.storage || (5 * 1024 * 1024 * 1024);
    const storagePercent = Math.min(100, Math.round((storageUsage / storageLimit) * 100));

    // Format bytes to humanoid string
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Circular Progress Constants
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (storagePercent / 100) * circumference;

    return (
        <ContentCard
            title={statsAny.name || t('commandCenter.identity.title')}
            icon={<Building2 className="text-blue-500" size={18} />}
            className="h-full border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
        >
            <div className="flex flex-col h-full justify-between gap-6 p-1">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none">
                                {statsAny.tier || t('commandCenter.identity.tier_fallback')}
                            </Badge>
                            {isSuperAdmin && <Badge variant="outline">{t('commandCenter.identity.superadmin_view')}</Badge>}
                        </div>
                        <p className="text-xs font-semibold text-slate-500">
                            {statsAny.industry || t('commandCenter.identity.industry_fallback')}
                        </p>
                    </div>
                    {statsAny.logo && (
                        <img src={statsAny.logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-slate-50 p-1 border" />
                    )}
                </div>

                {/* Circular Vital Indicator */}
                <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="relative flex items-center justify-center w-24 h-24">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r={radius}
                                className="stroke-slate-200 dark:stroke-slate-800 fill-none"
                                strokeWidth="8"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r={radius}
                                className="stroke-blue-500 fill-none transition-all duration-1000 ease-out"
                                strokeWidth="8"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-lg font-black font-mono">{storagePercent}%</span>
                            <span className="text-[9px] text-muted-foreground font-semibold">{t('commandCenter.identity.usage')}</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <HardDrive size={14} className="text-blue-500" />
                            <span>{t('charts.labels.storage')}</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                                <span className="opacity-70">{t('commandCenter.identity.used')}</span>
                                <span className="text-foreground font-bold">{formatBytes(storageUsage)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                                <span className="opacity-70">{t('commandCenter.identity.total')}</span>
                                <span>{formatBytes(storageLimit)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Link
                    href="/settings/billing"
                    className="group flex items-center justify-center gap-2 w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    {t('plan.manageBtn')}
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
            </div>

            {/* Expert Metadata - Phase 262.2 */}
            {expertMode && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-20 p-6 flex flex-col justify-center animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-4 text-purple-400 border-b border-purple-500/20 pb-2">
                        <Cpu size={16} />
                        <span className="text-xs font-bold">{t('commandCenter.expert.resource_trace')}</span>
                    </div>
                    <div className="space-y-2 font-mono text-[10px]">
                        <div className="flex justify-between">
                            <span className="text-slate-500">{t('commandCenter.expert.region')}:</span>
                            <span className="text-blue-400">{stats.infra?.region || "EU-WEST-1"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">{t('commandCenter.expert.quota')}:</span>
                            <span className="text-emerald-400 font-bold">{stats.tier || "ENTERPRISE"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">{t('commandCenter.expert.ttl')}:</span>
                            <span className="text-amber-400">{stats.infra?.ttlEnforcement || "ENABLED"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">{t('commandCenter.expert.cache')}:</span>
                            <span className="text-slate-200">{stats.infra?.cacheHitRate || "92.4%"}</span>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="mt-6 text-[9px] font-bold text-slate-500 hover:text-white transition-colors"
                    >
                        {t('commandCenter.expert.view_raw')}
                    </button>
                </div>
            )}
        </ContentCard>
    );
};
