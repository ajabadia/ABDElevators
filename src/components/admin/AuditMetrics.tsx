"use client";

import React from "react";
import { FileText, ShieldAlert, Zap, Activity } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { useTranslations } from "next-intl";

interface GlobalStats {
    totalCases: number;
    performance: {
        sla_violations_30d: number;
        rag_quality_avg: {
            avgFaithfulness: number;
        } | null;
    };
    usage: {
        tokens: number;
    };
}

interface AuditMetricsProps {
    stats: GlobalStats | null | undefined;
    isLoading: boolean;
}

export function AuditMetrics({ stats, isLoading }: AuditMetricsProps) {
    const t = useTranslations("admin.audit.metrics");

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ContentCard className="p-4" noPadding={true}>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("total_cases")}</div>
                    <FileText className="h-4 w-4 text-slate-300" />
                </div>
                <div className="p-4 pt-0">
                    <div className="text-2xl font-black font-outfit text-slate-900 dark:text-white">
                        {isLoading ? "..." : stats?.totalCases || 0}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">{t("accumulated")}</p>
                </div>
            </ContentCard>

            <ContentCard className="p-4" noPadding={true}>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("sla_violations")}</div>
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                </div>
                <div className="p-4 pt-0">
                    <div className={`text-2xl font-black font-outfit ${stats?.performance?.sla_violations_30d ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                        {isLoading ? "..." : stats?.performance?.sla_violations_30d || 0}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">{t("last_30d")}</p>
                </div>
            </ContentCard>

            <ContentCard className="p-4" noPadding={true}>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("tokens_consumed")}</div>
                    <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <div className="p-4 pt-0">
                    <div className="text-2xl font-black font-outfit text-slate-900 dark:text-white">
                        {isLoading ? "..." : `${Math.round((stats?.usage?.tokens || 0) / 1000)}k`}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">{t("llm_inference")}</p>
                </div>
            </ContentCard>

            <ContentCard className="p-4" noPadding={true}>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("rag_faithfulness")}</div>
                    <Activity className="h-4 w-4 text-teal-500" />
                </div>
                <div className="p-4 pt-0">
                    <div className="text-2xl font-black font-outfit text-teal-600">
                        {isLoading ? "..." : stats?.performance?.rag_quality_avg ? `${(stats.performance.rag_quality_avg.avgFaithfulness * 100).toFixed(0)}%` : "N/A"}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">{t("hallucination_score")}</p>
                </div>
            </ContentCard>
        </div>
    );
}
