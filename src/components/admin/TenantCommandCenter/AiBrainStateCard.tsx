"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BrainCircuit, ShieldCheck, Zap, Cog, Activity, Server, Database } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useUXStore } from "@/store/ux-store";

import { AI_MODELS, AI_MODEL_IDS } from "@abd/platform-core";

import { GlobalStats } from "@/services/admin/dashboard-service";

interface AiBrainStateCardProps {
    stats: GlobalStats;
}

/**
 * Block 4: AI Brain State (Bottom)
 * Shows the current state of the AI models, safety profiles, and autonomic flags.
 */
export const AiBrainStateCard: React.FC<AiBrainStateCardProps> = ({ stats }) => {
    const t = useTranslations('admin_analytics');
    const { expertMode } = useUXStore();

    // Default model information from platform-core source of truth
    const defaultModelId = AI_MODEL_IDS.GEMINI_2_5_FLASH;
    const defaultModel = AI_MODELS.find(m => m.id === defaultModelId);

    return (
        <ContentCard
            title={t('commandCenter.brain.title')}
            icon={<BrainCircuit className="text-purple-500" size={18} />}
            className="h-full border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
        >
            <div className="flex flex-col h-full justify-between gap-6 p-1">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500">{t('commandCenter.brain.engine')}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black italic text-slate-900 dark:text-white">{defaultModel?.name || 'Gemini 2.5 Flash'}</span>
                            <Badge variant="outline" className="text-[9px] border-purple-500/20 text-purple-600 dark:text-purple-400">{t('commandCenter.brain.production')}</Badge>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Activity className="text-purple-600 dark:text-purple-400 animate-pulse" size={24} />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-950">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <span className="text-xs font-semibold">{t('commandCenter.brain.security')}</span>
                        </div>
                        <span className="text-[10px] font-black bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm">{t('commandCenter.brain.balanced')}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-950">
                        <div className="flex items-center gap-3">
                            <Zap size={16} className="text-amber-500" />
                            <span className="text-xs font-semibold">{t('commandCenter.brain.selfHealing')}</span>
                        </div>
                        <Switch checked={true} disabled />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <p className="text-[9px] text-slate-500 font-bold">{t('commandCenter.brain.budget')}</p>
                        <p className="text-xs font-black text-purple-600 dark:text-purple-400">74% {t('commandCenter.brain.free')}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <p className="text-[9px] text-slate-500 font-bold">{t('commandCenter.brain.retry')}</p>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-500">{t('commandCenter.brain.active')}</p>
                    </div>
                </div>

                <Link
                    href="/agents"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                >
                    <Cog size={14} />
                    {t('commandCenter.brain.configBtn')}
                </Link>
            </div>

        </ContentCard>
    );
};
