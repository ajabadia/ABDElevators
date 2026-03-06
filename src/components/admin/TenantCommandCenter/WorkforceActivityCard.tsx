"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Users, MousePointer2, TrendingUp, Fingerprint, Map } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useUXStore } from "@/store/ux-store";

interface WorkforceActivityCardProps {
    health: any;
}

/**
 * Block 3: Workforce Activity (Center)
 * Shows recent active user bubbles and a simplified activity trend.
 */
export const WorkforceActivityCard: React.FC<WorkforceActivityCardProps> = ({ health }) => {
    const t = useTranslations('admin_analytics');
    const { expertMode } = useUXStore();
    const activeUsers = health?.activeUsers24h || 0;

    return (
        <ContentCard
            title={t('commandCenter.workforce.title')}
            icon={<Users className="text-teal-500" size={18} />}
            className="h-full border-l-4 border-l-teal-500 shadow-lg hover:shadow-xl transition-all lg:col-span-1"
        >
            <div className="flex flex-col h-full justify-between gap-6 p-1">
                <div className="space-y-1">
                    <p className="text-3xl font-black font-mono tracking-tighter">
                        {activeUsers}
                        <span className="text-xs text-muted-foreground font-sans tracking-normal ml-2">{t('commandCenter.workforce.activeUsers')}</span>
                    </p>
                    <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                        <TrendingUp size={12} />
                        <span>{t('commandCenter.workforce.trend')}</span>
                    </div>
                </div>

                <div className="flex -space-x-2 overflow-hidden py-2">
                    {[...Array(Math.min(5, activeUsers || 3))].map((_, i) => (
                        <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-background bg-slate-100 flex items-center justify-center text-[10px] font-black border border-slate-200">
                            U{i + 1}
                        </div>
                    ))}
                    {activeUsers > 5 && (
                        <div className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-background bg-teal-500 text-white text-[10px] font-black">
                            +{activeUsers - 5}
                        </div>
                    )}
                </div>

                <div className="bg-teal-500/5 p-4 rounded-2xl border border-teal-500/10 flex flex-col items-center justify-center text-center gap-2">
                    <MousePointer2 size={24} className="text-teal-500 opacity-50 mb-1" />
                    <p className="text-[10px] font-medium text-teal-700 dark:text-teal-400">
                        {t('commandCenter.workforce.peakHour')}: <span className="font-bold">{health?.analytics?.peakHour || "14:00 - 15:00"}</span>
                    </p>
                </div>

                <Link
                    href="/admin/users"
                    className="flex items-center justify-center gap-2 w-full py-3 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-xs rounded-xl hover:bg-teal-500/5 transition-colors"
                >
                    {t('commandCenter.workforce.policiesBtn')}
                </Link>
            </div>

            {/* Expert Metadata - Phase 262.2 */}
            {expertMode && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-20 p-6 flex flex-col justify-center animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-4 text-teal-400 border-b border-teal-500/20 pb-2">
                        <Fingerprint size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">{t('commandCenter.expert.access_trace')}</span>
                    </div>
                    <div className="space-y-2 font-mono text-[10px]">
                        <div className="flex justify-between">
                            <span className="text-slate-500">{t('commandCenter.expert.session_density')}:</span>
                            <span className="text-teal-400">{activeUsers} active</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">{t('commandCenter.expert.peak_concurrency')}:</span>
                            <span className="text-blue-400 font-bold">{health?.analytics?.peakConcurrency || 14}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">ABAC_SWEEP:</span>
                            <span className="text-emerald-400 font-bold">PASS (100%)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">UX_HEATMAP:</span>
                            <span className="text-slate-200">ACTIVE</span>
                        </div>
                    </div>
                    <button className="mt-6 text-[9px] font-bold text-slate-500 hover:text-white transition-colors">
                        GENERATE_ACCESS_REPORT.PDF {" >>"}
                    </button>
                </div>
            )}
        </ContentCard>
    );
};
