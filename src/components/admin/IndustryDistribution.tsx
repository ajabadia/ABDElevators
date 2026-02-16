"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { Badge } from "@/components/ui/badge";

interface IndustryDistributionProps {
    isSuperAdmin: boolean;
    industries: any[];
    tier?: string;
    t: any;
}

export function IndustryDistribution({ isSuperAdmin, industries, tier, t }: IndustryDistributionProps) {
    return (
        <ContentCard
            title={isSuperAdmin ? t('distribution.title') : t('plan.title')}
            icon={<TrendingUp className="text-teal-500" size={18} />}
            className="shadow-xl shadow-slate-200/50 dark:shadow-none"
        >
            {isSuperAdmin ? (
                <div className="space-y-3">
                    {industries.map((ind: any) => (
                        <div key={ind._id} className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border hover:border-teal-500/30 transition-all cursor-default group">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-teal-500 group-hover:scale-150 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-tight text-muted-foreground">{ind._id}</span>
                            </div>
                            <span className="font-mono font-black text-primary tabular-nums">{ind.count}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 space-y-6">
                    <div className="relative inline-block px-10 py-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2rem] font-black text-2xl shadow-2xl border border-slate-700">
                        <div className="absolute -top-1 -right-1">
                            <Badge className="bg-teal-500 text-white border-none text-[8px] font-black">{t('plan.active')}</Badge>
                        </div>
                        {tier || 'FREE'}
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('plan.renewal')}</p>
                        <p className="text-xs text-foreground font-bold mt-1">12 de Febrero, 2026</p>
                    </div>
                    <button className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 transition-all active:scale-95">
                        {t('plan.manageBtn')}
                    </button>
                </div>
            )}
        </ContentCard>
    );
}
