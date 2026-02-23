"use client";

import React from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import {
    Users,
    Briefcase,
    Database,
    Brain,
    ShieldAlert,
    RefreshCw,
    Clock,
    Activity,
    Server,
    HardDrive,
    Zap,
    AlertTriangle,
    TrendingUp,
    CreditCard,
    ArrowUpRight,
    Wallet
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useApiItem } from '@/hooks/useApiItem';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

/**
 * 🏰 SuperAdmin Global Dashboard (Phase 110)
 * Multi-tenant observability and platform health.
 */
export default function GlobalDashboardPage() {
    const t = useTranslations('admin.superadmin');
    const { toast } = useToast();
    const { data: metrics, isLoading, refresh: refreshMetrics } = useApiItem<any>({ endpoint: '/api/admin/superadmin/metrics' });
    const { data: anomalyData, isLoading: isLoadingAnomalies, refresh: refreshAnomalies } = useApiItem<any>({ endpoint: '/api/admin/superadmin/anomalies' });
    const { data: evolutionData, isLoading: isLoadingEvolution, refresh: refreshEvolution } = useApiItem<any>({ endpoint: '/api/admin/superadmin/ontology/evolution' });

    const refreshAll = () => {
        refreshMetrics();
        refreshAnomalies();
        refreshEvolution();
    };

    const { mutate: triggerSelfHealing, isLoading: isHealing } = useApiMutation<any>({
        endpoint: '/api/cron/self-healing',
        method: 'POST',
        onSuccess: (data: any) => {
            toast({
                title: t('toasts.audit_success_title'),
                description: t('toasts.audit_success_desc', { processed: data.processed, updated: data.updated }),
                variant: "default"
            });
            refreshAll();
        },
        onError: (err) => {
            toast({
                title: t('toasts.audit_error_title'),
                description: err || t('toasts.audit_error_desc'),
                variant: "destructive"
            });
        }
    });

    const { mutate: runPredictiveAudit, isLoading: isAuditing } = useApiMutation<any>({
        endpoint: '/api/cron/status-check',
        method: 'POST',
        onSuccess: (data: any) => {
            toast({
                title: t('toasts.predictive_success_title'),
                description: t('toasts.predictive_success_desc', { count: data.detectedCount }),
                variant: "default"
            });
            refreshAll();
        },
        onError: (err) => {
            toast({
                title: t('toasts.predictive_error_title'),
                description: err || t('toasts.predictive_error_desc'),
                variant: "destructive"
            });
        }
    });

    if (isLoading) {
        return (
            <PageContainer>
                <div className="space-y-8">
                    <Skeleton className="h-12 w-64" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                    </div>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    <div className="flex gap-4">
                        <Button
                            onClick={() => runPredictiveAudit({})}
                            disabled={isAuditing}
                            variant="outline"
                            className="bg-sidebar-primary/5 border-sidebar-primary/20 hover:bg-sidebar-primary/10 text-sidebar-primary font-bold gap-2"
                        >
                            <Zap className={isAuditing ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                            {t('actions.predictive_audit')}
                        </Button>
                        <Button
                            onClick={() => triggerSelfHealing({})}
                            disabled={isHealing}
                            variant="outline"
                            className="bg-sidebar-primary/5 border-sidebar-primary/20 hover:bg-sidebar-primary/10 text-sidebar-primary font-bold gap-2"
                        >
                            <RefreshCw className={isHealing ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                            {t('actions.self_healing')}
                        </Button>
                    </div>
                }
            />

            <div className="space-y-8 mt-6">
                {/* Real-time Health Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title={t('metrics.tenants')}
                        value={metrics?.tenants?.active || 0}
                        icon={<Users className="w-5 h-5" />}
                        description={t('metrics.tenants_cluster', { total: metrics?.tenants?.total || 0 })}
                    />
                    <MetricCard
                        title={t('metrics.cases')}
                        value={metrics?.cases?.total || 0}
                        icon={<Briefcase className="w-5 h-5" />}
                        trend="+12%"
                        trendDirection="up"
                    />
                    <MetricCard
                        title={t('metrics.ai_accuracy')}
                        value={`${metrics?.ai?.accuracy || 0}%`}
                        icon={<Brain className="w-5 h-5" />}
                        description={t('metrics.ai_validations', { count: metrics?.ai?.totalFeedbacks || 0 })}
                    />
                </div>

                {/* ERA 7: Platform Observability Hub */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title={t('metrics.ai_health')}
                        value={`${metrics?.ai?.telemetry?.successRate || 100}%`}
                        icon={<Activity className="w-5 h-5 text-emerald-500" />}
                        description={t('metrics.health_stat', { success: metrics?.ai?.health?.success || 0, failure: metrics?.ai?.health?.failure || 0 })}
                        className="bg-emerald-50/50 border-emerald-100"
                    />
                    <MetricCard
                        title={t('metrics.latency')}
                        value={`${metrics?.ai?.telemetry?.avgLatency || 0}ms`}
                        icon={<Clock className="w-5 h-5 text-indigo-500" />}
                        description={t('metrics.latency_desc')}
                        className="bg-indigo-50/50 border-indigo-100"
                    />
                    <MetricCard
                        title={t('metrics.consumption')}
                        value={metrics?.usage?.prediction?.projection?.estimatedSpend ? `$${metrics.usage.prediction.projection.estimatedSpend}` : "---"}
                        icon={<Zap className="w-5 h-5 text-amber-500" />}
                        description={t('metrics.consumption_desc')}
                        className="bg-amber-50/50 border-amber-100"
                    />
                </div>

                {/* Platform Financials (Phase 110) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="rounded-3xl border-none shadow-sm bg-emerald-900 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Wallet className="w-24 h-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase tracking-tighter">{t('financials.title')}</CardTitle>
                            <CardDescription className="text-emerald-200">{t('financials.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex justify-between items-end border-b border-emerald-800/50 pb-3">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-widest">{t('financials.expenditure')}</span>
                                    <p className="text-2xl font-black">${metrics?.usage?.global?.estimatedCost || 0}</p>
                                </div>
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-none mb-1">
                                    {metrics?.usage?.global?.totalTokens?.toLocaleString()} tokens
                                </Badge>
                            </div>

                            {/* Proyección Predictiva (Fase 110) */}
                            {metrics?.usage?.prediction && (
                                <div className="p-3 rounded-2xl bg-emerald-800/40 border border-emerald-700/50 space-y-2">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-emerald-300 tracking-widest">
                                        <span>{t('financials.prediction_title')}</span>
                                        <Badge variant="outline" className="text-[9px] border-emerald-500 text-emerald-200">
                                            {t('financials.confidence', { percentage: Math.round(metrics.usage.prediction.confidenceScore * 100) })}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <p className="text-xl font-black text-emerald-100">${metrics.usage.prediction.projection.estimatedSpend}</p>
                                        <p className="text-[10px] text-emerald-400 font-medium">{t('financials.projection_30d')}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-end pt-2">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-widest">{t('financials.platform_value')}</span>
                                    <p className="text-2xl font-black text-emerald-400">${metrics?.usage?.global?.estimatedValue || 0}</p>
                                </div>
                                <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs mb-1">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>{t('financials.roi')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Users className="w-5 h-5 text-sidebar-primary" />
                                    {t('usage.title')}
                                </CardTitle>
                                <CardDescription>{t('usage.desc')}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {metrics?.usage?.topTenants?.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {metrics.usage.topTenants.map((tenant: any) => (
                                            <div key={tenant.tenantId} className="group p-4 rounded-3xl bg-white border border-slate-100 hover:border-sidebar-primary/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all space-y-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                        {tenant.tenantId.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{tenant.tenantId}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">{t('usage.tokens')}: {tenant.tokens?.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold text-slate-700">{(tenant.storage / (1024 * 1024)).toFixed(1)} MB</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">{t('usage.storage')}</p>
                                                    </div>
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-xs font-bold text-emerald-600">+{tenant.savings?.toLocaleString()}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase">{t('usage.savings')}</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="group-hover:text-sidebar-primary">
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground text-sm italic">
                                        {t('usage.no_data')}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 rounded-3xl border-none shadow-sm bg-slate-50/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-sidebar-primary" />
                                {t('knowledge.title')}
                            </CardTitle>
                            <CardDescription>{t('knowledge.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-800">{t('knowledge.obsolete')}</p>
                                    <p className="text-xs text-muted-foreground">{t('knowledge.obsolete_desc')}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant={metrics?.knowledge?.obsoleteAssets > 0 ? "destructive" : "outline"} className={metrics?.knowledge?.obsoleteAssets === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" : "font-bold"}>
                                        {t('knowledge.pending', { count: metrics?.knowledge?.obsoleteAssets || 0 })}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-800">{t('knowledge.cluster_health')}</p>
                                    <p className="text-xs text-muted-foreground">{t('knowledge.db_status')}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge className="bg-emerald-500 font-bold">AUTH: OK</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Anomalies Widget */}
                    <Card className="rounded-3xl border-none shadow-sm bg-slate-50/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    {t('anomalies.title')}
                                </div>
                                {anomalyData?.anomalies?.total > 0 && (
                                    <Badge variant="destructive" className="animate-pulse">
                                        {t('anomalies.alerts', { count: anomalyData.anomalies.total })}
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>{t('anomalies.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {isLoadingAnomalies ? (
                                [1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)
                            ) : anomalyData?.anomalies?.total === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">{t('anomalies.no_anomalies')}</p>
                                </div>
                            ) : (
                                <>
                                    {[...(anomalyData.anomalies.latency || []), ...(anomalyData.anomalies.errors || [])].map((anomaly: any) => (
                                        <div key={anomaly.id} className="p-3 rounded-xl bg-white border border-slate-100 flex items-start gap-4">
                                            <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${anomaly.severity === 'CRITICAL' ? 'bg-red-500' :
                                                anomaly.severity === 'HIGH' ? 'bg-orange-500' : 'bg-amber-500'
                                                }`} />
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-800 leading-tight">{anomaly.message}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Z-score: {anomaly.details.zScore.toFixed(2)} | {new Date(anomaly.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-none shadow-sm bg-indigo-900 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Server className="w-32 h-32" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase tracking-tighter">{t('infra.title')}</CardTitle>
                            <CardDescription className="text-indigo-200">{t('infra.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">{t('infra.environment')}</span>
                                <p className="text-sm font-bold">PRODUCTION / VERCEL</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">{t('infra.db_tier')}</span>
                                <p className="text-sm font-bold">M10 / Dedicated Cluster</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">{t('infra.ai_engine')}</span>
                                <p className="text-sm font-bold">Gemini 004 / Pro Advanced</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 🧠 Sovereign Engine Section (Phase 160.4) */}
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
            </div>
        </PageContainer>
    );
}
