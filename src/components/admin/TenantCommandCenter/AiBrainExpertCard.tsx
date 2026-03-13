"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Server, Activity, Database, RefreshCw, Maximize, Maximize2, Zap } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { AI_MODEL_IDS } from "@abd/platform-core";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface AiBrainExpertCardProps {
    isCompact?: boolean;
}

export const AiBrainExpertCard: React.FC<AiBrainExpertCardProps> = ({ isCompact }) => {
    const t = useTranslations('admin_analytics');
    const defaultModelId = AI_MODEL_IDS.GEMINI_2_5_FLASH;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer group h-full">
                    <ContentCard
                        title={t('commandCenter.expert.model_trace')}
                        icon={<Server className="text-purple-400" size={18} />}
                        className={cn(
                            "h-full bg-slate-950 border-purple-500/20 shadow-2xl transition-all group-hover:border-purple-500/40 relative",
                            isCompact ? "p-3" : "p-5"
                        )}
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 size={12} className="text-slate-500" />
                        </div>
                        <div className="space-y-3 font-mono text-[11px] p-1">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Activity size={12} />
                                    <span>MODEL_ID:</span>
                                </div>
                                <span className="text-purple-400 font-bold">{defaultModelId}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Activity size={12} />
                                    <span>AVG_TOKENS_SEC:</span>
                                </div>
                                <span className="text-blue-400 font-bold">142.4 tps</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Database size={12} />
                                    <span>KNOWLEDGE_VECTOR:</span>
                                </div>
                                <span className="text-emerald-400 font-bold">HNSW (Index_A)</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <RefreshCw size={12} />
                                    <span>RETRY_THRESHOLD:</span>
                                </div>
                                <span className="text-amber-400">3 (Exponential)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Maximize size={12} />
                                    <span>CONTEXT_WINDOW:</span>
                                </div>
                                <span className="text-slate-200">1.0M</span>
                            </div>

                            <div className="mt-4 border border-purple-500/10 rounded-lg overflow-hidden">
                                <div className="bg-purple-500/10 p-1.5 flex justify-between items-center">
                                    <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Inference Load</span>
                                    <span className="text-[8px] text-slate-500">Real-time</span>
                                </div>
                                <div className="h-6 flex items-end gap-0.5 p-1 bg-black/20">
                                    {[40, 70, 45, 90, 65, 30, 85, 50].map((h, i) => (
                                        <div key={i} className="flex-1 bg-purple-500/50 rounded-t-sm" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ContentCard>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-950 border-purple-500/30 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-purple-400 uppercase tracking-tighter">
                        <Zap size={20} />
                        {t('commandCenter.expert.model_trace')} - Inference Telemetry
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-6 space-y-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                         <div className="flex justify-between items-center mb-8">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inference Timeline (Last 60s)</h4>
                            <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] text-purple-400 font-bold">
                                LLM_LOAD_STABLE
                            </div>
                         </div>
                         <div className="h-40 flex items-end gap-1.5">
                            {[20, 35, 25, 60, 45, 30, 75, 40, 50, 90, 65, 35, 45, 20, 55, 30, 85, 40, 50, 25].map((h, i) => (
                                <div key={i} className="flex-1 bg-purple-600/30 border-t border-purple-400/50 relative group/inference">
                                    <div className="absolute inset-0 bg-purple-400 animate-pulse opacity-0 group-hover/inference:opacity-20" />
                                    <div className="h-full w-full" style={{ height: `${h}%` }} />
                                </div>
                            ))}
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-3">
                            <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Tokenizer Info</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span>Encoding:</span>
                                    <span className="text-slate-400">CL100K_BASE</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Density:</span>
                                    <span className="text-emerald-400">Low (Optimized)</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-3">
                            <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Autonomic Governance</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span>State:</span>
                                    <span className="text-purple-400 font-bold italic">Dynamic</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Sync:</span>
                                    <span className="text-emerald-400 font-bold">LOCKED</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
