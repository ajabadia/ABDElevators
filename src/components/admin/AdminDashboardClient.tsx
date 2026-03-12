"use client";

import React, { useEffect, useState } from "react";
import {
    Activity,
    Monitor,
    LayoutGrid,
    Info,
    History
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useUXStore } from "@/store/ux-store";
import { GlobalStats, HealthData } from "@/services/admin/dashboard-service";

// ERA 10 Command Center Components
import {
    IdentityVitalityCard,
    OperationalPulseCard,
    WorkforceActivityCard,
    AiBrainStateCard
} from "@/components/admin/TenantCommandCenter";
import { DashboardRecentActivity } from "@/components/admin/DashboardRecentActivity";
import { DashboardSla } from "@/components/admin/DashboardSla";
import { ProactiveHealthListener } from "@/components/admin/ProactiveHealthListener";


interface AdminDashboardClientProps {
    initialStats: GlobalStats;
    initialHealth: HealthData;
    isSuperAdmin: boolean;
}

/**
 * AdminDashboardClient
 * ERA 11: Client-side logic for the high-performance dashboard.
 */
export function AdminDashboardClient({ initialStats, initialHealth, isSuperAdmin }: AdminDashboardClientProps) {
    const t = useTranslations('admin_analytics');
    const { expertMode, toggleExpertMode } = useUXStore();
    const [isCompact, setIsCompact] = useState(false);

    // Expert Mode Toggle (Shift+X) - Phase 262.2
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key.toLowerCase() === 'x') {
                e.preventDefault();
                toggleExpertMode();

                const isNowActive = !expertMode;
                toast(isNowActive ? t('toasts.expert_active') : t('toasts.standard_active'), {
                    description: isNowActive
                        ? t('toasts.expert_desc')
                        : t('toasts.standard_desc'),
                    icon: isNowActive ? <History className="text-purple-500" /> : <Info className="text-blue-500" />
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [expertMode, toggleExpertMode]);

    return (
        <PageContainer className={isCompact ? "p-4 transition-all duration-300" : "transition-all duration-300"}>
            {isSuperAdmin && <ProactiveHealthListener />}
            <PageHeader
                title={isSuperAdmin ? t('titles.global') : t('titles.tenant')}
                subtitle={!isCompact ? t('titles.subtitle') : undefined}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            aria-label={t('warRoomToggle')}
                            className={`p-2 rounded-xl transition-all shadow-sm ${isCompact ? 'bg-teal-500 text-white shadow-teal-500/20' : 'bg-white border border-border text-muted-foreground hover:bg-slate-50'}`}
                        >
                            {isCompact ? <Monitor size={20} /> : <LayoutGrid size={20} />}
                        </button>

                        <Badge variant="outline" className={`gap-2 px-3 py-1 bg-background border-border rounded-lg text-xs font-semibold shadow-sm transition-all ${expertMode ? 'border-purple-500 text-purple-600 animate-pulse' : 'text-teal-600 dark:text-teal-400'}`}>
                            {expertMode ? (
                                <>
                                    <History size={14} className="text-purple-500" />
                                    {isSuperAdmin ? t('commandCenter.identity.superadmin_view') : t('toasts.expert_active').toUpperCase()}
                                    <span className="ml-1 opacity-50">[Shift+X]</span>
                                </>
                            ) : (
                                <>
                                    <Activity size={14} className="motion-safe:animate-pulse text-teal-500" />
                                    {t('liveFeed')}
                                </>
                            )}
                        </Badge>
                    </div>
                }
            />

            {/* Main Command Grid - 4 Blocks (Phase 262.1) */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isCompact ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6 mb-8`}>
                <IdentityVitalityCard stats={initialStats} isSuperAdmin={isSuperAdmin} />
                <OperationalPulseCard health={initialHealth} />
                <WorkforceActivityCard health={initialHealth} />
                <AiBrainStateCard stats={initialStats} />
            </div>

            {/* SLA Dashboard (Phase 310) */}
            {isSuperAdmin && (
                <div className="mt-8">
                    <DashboardSla days={7} />
                </div>
            )}

            {/* Adaptive Activity Section */}
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                    <History size={18} className="text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('activity.title')}</h3>
                </div>
                <DashboardRecentActivity activities={initialStats.recent_activity} t={t} />
            </div>

            {/* Expert Mode Hint - Phase 262.2 Footer */}
            {!expertMode && (
                <div className="mt-12 mb-4 text-center">
                    <p className="text-xs font-medium text-slate-400 flex items-center justify-center gap-3">
                        <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />
                        {t('hints.expert_mode_shortcut')}
                        <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />
                    </p>
                </div>
            )}

            {/* Expert Overlays (Phase 262.2) */}
            {expertMode && (
                <div className="fixed bottom-6 right-6 z-50 p-4 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 text-[10px] font-mono animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-2 border-b border-slate-200 dark:border-white/10 pb-2">
                        <History size={12} className="text-purple-600 dark:text-purple-400" />
                        <p className="text-purple-600 dark:text-purple-400 font-bold">{t('commandCenter.expert.panel_title')}</p>
                    </div>
                    <div className="space-y-1.5 opacity-90">
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-400">LATENCY_P95:</span>
                            <span className="text-emerald-400 font-bold">142ms</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-400">DB_POOL:</span>
                            <span className="text-blue-400 font-bold">Safe (7 active)</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-400">CORRELATION_ID:</span>
                            <span className="text-amber-400">ER11-HPA-{Math.floor(Math.random() * 10000)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-400">SERVER_LOAD:</span>
                            <span className="text-slate-400">Optimized (Server Components)</span>
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
