"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Code, Zap, Activity, AlertCircle, Maximize2, LineChart } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { HealthData } from "@/services/admin/dashboard-service";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface OperationalExpertCardProps {
    health: HealthData;
    isCompact?: boolean;
}

export const OperationalExpertCard: React.FC<OperationalExpertCardProps> = ({ health, isCompact }) => {
    const t = useTranslations('admin_analytics');
    const ragLatency = health?.avgRagLatency || 0;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer group h-full">
                    <ContentCard
                        title={t('commandCenter.expert.network_trace')}
                        icon={<Code className="text-emerald-400" size={18} />}
                        className={cn(
                            "h-full bg-slate-950 border-emerald-500/20 shadow-2xl transition-all group-hover:border-emerald-500/40 relative",
                            isCompact ? "p-3" : "p-5"
                        )}
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 size={12} className="text-slate-500" />
                        </div>
                        <div className="space-y-3 font-mono text-[11px] p-1">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Zap size={12} />
                                    <span>{t('commandCenter.expert.ingest_sla')}:</span>
                                </div>
                                <span className="text-emerald-400">{health?.ingestSlaScore || "99.9%"}%</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Activity size={12} />
                                    <span>RAG_P95:</span>
                                </div>
                                <span className="text-blue-400 font-bold">{ragLatency}ms</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Activity size={12} />
                                    <span>{t('commandCenter.expert.workers')}:</span>
                                </div>
                                <span className="text-amber-400">{health?.activeWorkers || 0} (BullMQ)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <AlertCircle size={12} />
                                    <span>{t('commandCenter.expert.dlq')}:</span>
                                </div>
                                <span className="text-rose-400">{health?.dlqSize || 0}</span>
                            </div>

                            <div className="mt-4 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                                <div className="flex items-center gap-2 text-[9px] text-emerald-400 font-black mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    INGEST_STREAM_OK
                                </div>
                                <div className="grid grid-cols-4 gap-1 h-3">
                                    <div className="bg-emerald-500/40 rounded-sm" />
                                    <div className="bg-emerald-500/60 rounded-sm" />
                                    <div className="bg-emerald-500/30 rounded-sm" />
                                    <div className="bg-emerald-500/80 rounded-sm" />
                                </div>
                            </div>
                        </div>
                    </ContentCard>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-slate-950 border-emerald-500/30 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-emerald-400 uppercase tracking-tighter">
                        <LineChart size={20} />
                        {t('commandCenter.expert.network_trace')} - Low Level Ingest Trace
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-6 space-y-8">
                    <div className="p-6 rounded-2xl bg-slate-900 border border-white/5">
                         <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Latency Variance (RAG Pipeline)</h4>
                            <div className="flex gap-4 text-[10px]">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> P95</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white/20" /> Baseline</span>
                            </div>
                         </div>
                         <div className="h-48 flex items-end gap-2 px-2 relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between opacity-10 py-2">
                                <div className="border-t border-white w-full" />
                                <div className="border-t border-white w-full" />
                                <div className="border-t border-white w-full" />
                            </div>
                            {/* Bars */}
                            {[20, 45, 30, 80, 50, 60, 40, 95, 30, 40, 55, 70, 45, 30].map((h, i) => (
                                <div key={i} className="group/bar flex-1 relative">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 bg-blue-500 text-[8px] px-1 rounded transition-opacity">
                                        {Math.floor(h * 3)}ms
                                    </div>
                                    <div className="w-full bg-blue-500/20 rounded-t-sm border-t border-blue-400/50" style={{ height: `${h}%` }} />
                                    <div className="w-full bg-white/5 h-[2px] mt-[1px]" />
                                </div>
                            ))}
                         </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Throughput</p>
                            <p className="text-2xl font-black italic">14.2 MB/s</p>
                            <p className="text-[10px] text-emerald-400 font-bold">↑ 4.1% vs prev hr</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Threads</p>
                            <p className="text-2xl font-black italic">32</p>
                            <p className="text-[10px] text-blue-400 font-bold">Stable (Pool: 64)</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Error Rate</p>
                            <p className="text-2xl font-black italic text-rose-500">0.02%</p>
                            <p className="text-[10px] text-slate-400 font-bold">Cluster Standard</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
