"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Cpu, Server, Database, Globe, Maximize2, Activity } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { GlobalStats } from "@/services/admin/dashboard-service";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface IdentityExpertCardProps {
    stats: GlobalStats;
    isCompact?: boolean;
}

export const IdentityExpertCard: React.FC<IdentityExpertCardProps> = ({ stats, isCompact }) => {
    const t = useTranslations('admin_analytics');

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer group h-full">
                    <ContentCard
                        title={t('commandCenter.expert.resource_trace')}
                        icon={<Cpu className="text-purple-400" size={18} />}
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
                                    <Globe size={12} />
                                    <span>{t('commandCenter.expert.region')}:</span>
                                </div>
                                <span className="text-blue-400 font-bold">{stats.infra?.region || "EU-WEST-1"}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Server size={12} />
                                    <span>{t('commandCenter.expert.quota')}:</span>
                                </div>
                                <span className="text-emerald-400 font-bold">{(stats as any).tier || "ENTERPRISE"}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Database size={12} />
                                    <span>{t('commandCenter.expert.ttl')}:</span>
                                </div>
                                <span className="text-amber-400">{stats.infra?.ttlEnforcement || "ENABLED"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Activity size={12} />
                                    <span>{t('commandCenter.expert.cache')}:</span>
                                </div>
                                <span className="text-slate-200">{stats.infra?.cacheHitRate || "92.4%"}</span>
                            </div>
                            
                            <div className="mt-4 pt-2 border-t border-purple-500/10">
                                <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-2">Cluster Status</p>
                                <div className="flex gap-1">
                                    <div className="h-1.5 flex-1 bg-emerald-500/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[98%]" />
                                    </div>
                                    <div className="h-1.5 flex-1 bg-blue-500/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[85%]" />
                                    </div>
                                    <div className="h-1.5 flex-1 bg-purple-500/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 w-[40%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ContentCard>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-950 border-purple-500/30 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-purple-400 uppercase tracking-tighter">
                        <Cpu size={20} />
                        {t('commandCenter.expert.resource_trace')} - Advanced Diagnostic
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-8 mt-6">
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Global Distribution</h4>
                            <div className="space-y-4">
                                {['Primary (AWS)', 'Secondary (GCP)', 'Edge (Cloudflare)'].map((node, i) => (
                                    <div key={node} className="space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-400">{node}</span>
                                            <span className={i === 2 ? "text-amber-400" : "text-emerald-400"}>
                                                {i === 0 ? 'Optimal' : i === 1 ? 'Standby' : 'Degraded (HFA)'}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className={cn("h-full bg-emerald-500", i === 2 && "bg-amber-500 w-[15%]", i === 0 && "w-[95%]", i === 1 && "w-[80%]")} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 font-mono text-xs">
                         <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3">
                            <p className="text-[10px] text-purple-400 font-black tracking-widest uppercase">Kubernetes Ingress</p>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Autoscale Mode:</span>
                                <span className="text-purple-300">HPA/v2</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Min/Max Pods:</span>
                                <span>2 / 10</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Cooldown:</span>
                                <span>300s</span>
                            </div>
                         </div>
                         <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
                            <p className="text-[10px] text-blue-400 font-black tracking-widest uppercase mb-2">Memory Allocation</p>
                            <div className="h-20 flex items-end gap-1">
                                {[30, 45, 25, 60, 80, 55, 40].map((h, i) => (
                                    <div key={i} className="flex-1 bg-blue-500/40 border-t border-blue-400" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                         </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

import { cn } from "@/lib/utils";
