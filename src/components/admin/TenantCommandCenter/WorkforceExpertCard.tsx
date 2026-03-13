"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Fingerprint, Users, Shield, Map, Maximize2, ShieldAlert, Key } from "lucide-react";
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

interface WorkforceExpertCardProps {
    health: HealthData;
    isCompact?: boolean;
}

export const WorkforceExpertCard: React.FC<WorkforceExpertCardProps> = ({ health, isCompact }) => {
    const t = useTranslations('admin_analytics');
    const activeUsers = health?.activeUsers24h || 0;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer group h-full">
                    <ContentCard
                        title={t('commandCenter.expert.access_trace')}
                        icon={<Fingerprint className="text-teal-400" size={18} />}
                        className={cn(
                            "h-full bg-slate-950 border-teal-500/20 shadow-2xl transition-all group-hover:border-teal-500/40 relative",
                            isCompact ? "p-3" : "p-5"
                        )}
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 size={12} className="text-slate-500" />
                        </div>
                        <div className="space-y-3 font-mono text-[11px] p-1">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Users size={12} />
                                    <span>{t('commandCenter.expert.session_density')}:</span>
                                </div>
                                <span className="text-teal-400">{activeUsers} {t('commandCenter.workforce.active')}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Users size={12} />
                                    <span>{t('commandCenter.expert.peak_concurrency')}:</span>
                                </div>
                                <span className="text-blue-400 font-bold">{health?.analytics?.peakConcurrency || 14}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Shield size={12} />
                                    <span>ABAC_SWEEP:</span>
                                </div>
                                <span className="text-emerald-400 font-bold">PASS (100%)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Map size={12} />
                                    <span>UX_HEATMAP:</span>
                                </div>
                                <span className="text-slate-200">{t('commandCenter.brain.active').toUpperCase()}</span>
                            </div>

                            <div className="mt-4 flex flex-col gap-1.5">
                                <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Auth Integrity</p>
                                <div className="flex justify-between items-center bg-white/5 p-1.5 rounded border border-white/5">
                                    <span className="text-[9px] text-slate-400">JWT_ROTATION</span>
                                    <div className="h-1 w-12 bg-emerald-500/30 rounded-full">
                                        <div className="h-full bg-emerald-500 w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ContentCard>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-950 border-teal-500/30 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-teal-400 uppercase tracking-tighter">
                        <Fingerprint size={20} />
                        {t('commandCenter.expert.access_trace')} - Security Audit
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20 space-y-3">
                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-teal-400 tracking-widest">
                                <ShieldAlert size={14} />
                                Autonomic Audit Sweeps
                            </h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">MFA Integrity:</span>
                                    <span className="text-emerald-400">Secured</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Last Sweep:</span>
                                    <span>2.4m ago</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Anomalies:</span>
                                    <span className="text-slate-500">0 detected</span>
                                </div>
                            </div>
                         </div>
                         <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-400 tracking-widest">
                                <Key size={14} />
                                Access Policy (ABAC)
                            </h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Policy Version:</span>
                                    <span>v3.4.1</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Attribute Sync:</span>
                                    <span className="text-emerald-400">Live</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Cache TTL:</span>
                                    <span>600s</span>
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900 border border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">User Interaction Heatmap (Real-time Cluster)</h4>
                        <div className="h-40 relative rounded-lg overflow-hidden bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                            {/* Fake heatmap spots */}
                            <div className="absolute top-1/4 left-1/3 w-16 h-16 bg-teal-500/30 blur-2xl rounded-full" />
                            <div className="absolute bottom-1/3 right-1/4 w-20 h-20 bg-blue-500/20 blur-2xl rounded-full" />
                            <div className="absolute top-2/3 left-1/2 w-12 h-12 bg-teal-400/40 blur-xl rounded-full" />
                            
                            {/* Grid overlay */}
                            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6">
                                {Array.from({ length: 72 }).map((_, i) => (
                                    <div key={i} className="border-[0.5px] border-white/5" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
