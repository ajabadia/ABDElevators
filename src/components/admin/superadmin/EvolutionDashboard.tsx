"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Activity, TrendingUp, Database } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EvolutionDashboardProps {
    evolutionData: any;
    isLoadingEvolution: boolean;
}

export function EvolutionDashboard({ evolutionData, isLoadingEvolution }: EvolutionDashboardProps) {
    const t = useTranslations('admin.superadmin');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                    <CardTitle className="text-lg font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-indigo-600" />
                            {t('evolution.title')}
                        </div>
                        {evolutionData?.evolution?.pendingProposals > 0 && (
                            <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 font-bold">
                                {t('evolution.improvements', { count: evolutionData.evolution.pendingProposals })}
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>{t('evolution.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {isLoadingEvolution ? (
                        <Skeleton className="h-40 w-full" />
                    ) : evolutionData?.evolution?.driftSummary?.length > 0 ? (
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('evolution.drift_label')}</p>
                            <div className="grid grid-cols-1 gap-3">
                                {evolutionData.evolution.driftSummary.slice(0, 3).map((drift: any, idx: number) => (
                                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-white border border-slate-200">
                                                <Activity className="w-3 h-3 text-indigo-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <span>{drift.from}</span>
                                                    <TrendingUp className="w-3 h-3 text-slate-400" />
                                                    <span className="text-indigo-600">{drift.to}</span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">{t('evolution.drift_target', { category: drift.target })}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] font-bold">
                                            {t('evolution.drift_frequency', { count: drift.frequency })}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                                <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                                    {t('evolution.drift_summary', {
                                        driftPoints: evolutionData.evolution.totalDriftPoints,
                                        proposals: evolutionData.evolution.pendingProposals
                                    })}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">{t('evolution.stable')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-slate-50/50">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">{t('evolution.proposals_title')}</CardTitle>
                    <CardDescription>{t('evolution.proposals_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoadingEvolution ? (
                        <Skeleton className="h-40 w-full" />
                    ) : evolutionData?.evolution?.proposals?.length > 0 ? (
                        <div className="space-y-3">
                            {evolutionData.evolution.proposals.slice(0, 2).map((proposal: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge className={proposal.action === 'UPDATE' ? 'bg-blue-500' : proposal.action === 'CREATE' ? 'bg-emerald-500' : 'bg-amber-500'}>
                                            {proposal.action}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-slate-400">{t('evolution.confidence', { percentage: (proposal.confidence * 100).toFixed(0) })}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">{proposal.newName || proposal.targetKey}</p>
                                    <p className="text-xs text-muted-foreground italic">&quot;{proposal.reasoning}&quot;</p>
                                </div>
                            ))}
                            {evolutionData.evolution.proposals.length > 2 && (
                                <p className="text-center text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">
                                    {t('evolution.view_more', { count: evolutionData.evolution.proposals.length - 2 })}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-3xl text-sm text-slate-400 font-medium">
                            {t('evolution.no_proposals')}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
