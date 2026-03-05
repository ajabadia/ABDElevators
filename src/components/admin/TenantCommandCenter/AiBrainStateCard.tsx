"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BrainCircuit, ShieldCheck, Zap, Cog, Activity, Server, Database } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useUXStore } from "@/store/ux-store";

interface AiBrainStateCardProps {
    stats: any;
}

/**
 * Block 4: AI Brain State (Bottom)
 * Shows the current state of the AI models, safety profiles, and autonomic flags.
 */
export const AiBrainStateCard: React.FC<AiBrainStateCardProps> = ({ stats }) => {
    const t = useTranslations('admin_analytics');
    const { expertMode } = useUXStore();

    return (
        <ContentCard
            title={t('commandCenter.brain.title')}
            icon={<BrainCircuit className="text-purple-500" size={18} />}
            className="h-full border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
        >
            <div className="flex flex-col h-full justify-between gap-6 p-1">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('commandCenter.brain.engine')}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black italic">Gemini 1.5 Pro</span>
                            <Badge variant="outline" className="text-[9px] border-purple-500/20 text-purple-600">PRODUCTION</Badge>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Activity className="text-purple-500 animate-pulse" size={24} />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <span className="text-xs font-semibold">{t('commandCenter.brain.security')}</span>
                        </div>
                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">BALANCED</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <Zap size={16} className="text-amber-500" />
                            <span className="text-xs font-semibold">{t('commandCenter.brain.selfHealing')}</span>
                        </div>
                        <Switch checked={true} disabled />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">{t('commandCenter.brain.budget')}</p>
                        <p className="text-xs font-black">74% free</p>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">{t('commandCenter.brain.retry')}</p>
                        <p className="text-xs font-black">Active</p>
                    </div>
                </div>

                <Link
                    href="/admin/ai"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                >
                    <Cog size={14} />
                    {t('commandCenter.brain.configBtn')}
                </Link>
            </div>

            {/* Expert Metadata - Phase 262.2 */}
            {expertMode && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-20 p-6 flex flex-col justify-center animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-4 text-purple-400 border-b border-purple-500/20 pb-2">
                        <Server size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Model Trace</span>
                    </div>
                    <div className="space-y-2 font-mono text-[10px]">
                        <div className="flex justify-between">
                            <span className="text-slate-500">MODEL_ID:</span>
                            <span className="text-purple-400 font-bold">gemini-1.5-pro-002</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">AVG_TOKENS_SEC:</span>
                            <span className="text-blue-400 font-bold">142.4 tps</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">KNOWLEDGE_VECTOR:</span>
                            <span className="text-emerald-400 font-bold">HNSW (Index_A)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">RETRY_THRESHOLD:</span>
                            <span className="text-amber-400">3 (Exponential)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">CONTEXT_WINDOW:</span>
                            <span className="text-slate-200">2.0M</span>
                        </div>
                    </div>
                    <button className="mt-6 text-[9px] font-bold text-slate-500 hover:text-white transition-colors">
                        OPEN_PROMPT_GOVERNANCE {" >>"}
                    </button>
                </div>
            )}
        </ContentCard>
    );
};
