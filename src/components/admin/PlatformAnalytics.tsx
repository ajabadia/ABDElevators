"use client";

import React from 'react';
import Link from 'next/link';
import {
    Users,
    Building2,
    TrendingUp,
    DollarSign,
    AlertTriangle,
    ShieldCheck,
    Zap,
    BarChart3,
    Search,
    RefreshCw,
    Activity,
    Server,
    FileText,
    ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useApiItem } from '@/hooks/useApiItem';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface GlobalStats {
    totalTenants: number;
    totalUsers: number;
    totalFiles: number;
    totalCases: number;
    mau: number;
    mrr: number;
    performance: {
        sla_violations_30d: number;
        errors_30d: number;
        rag_quality_avg: {
            avgFaithfulness: number;
            avgRelevance: number;
            avgPrecision: number;
        } | null;
    };
    usage: {
        tokens: number;
        storage: number;
        searches: number;
        savings: number;
    };
    industries: { _id: string; count: number }[];
    recent_tenants: any[];
}

export function PlatformAnalytics() {
    const t = useTranslations('admin.analytics.explorer');
    const tKpi = useTranslations('admin.analytics.explorer.kpi');
    const tQuality = useTranslations('admin.analytics.explorer.quality');
    const tSystem = useTranslations('admin.analytics.explorer.system');
    const tAdopters = useTranslations('admin.analytics.explorer.adopters');

    const { data: stats, isLoading, refresh } = useApiItem<GlobalStats>({
        endpoint: '/api/admin/global-stats',
        dataKey: 'global'
    });

    if (isLoading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative">
                    <RefreshCw className="animate-spin text-teal-600 h-10 w-10" aria-hidden="true" />
                    <div className="absolute inset-0 blur-lg bg-teal-500/10 animate-pulse" />
                </div>
                <p className="text-slate-500 font-bold text-xs animate-pulse">{t('loading')}</p>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <TrendingUp className="text-teal-600 w-7 h-7" aria-hidden="true" />
                        {t('title')}
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">{t('subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => refresh()} className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                        <RefreshCw size={18} className="text-slate-400" aria-hidden="true" />
                    </Button>
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-950 px-4 py-2 border-slate-200 dark:border-slate-700 shadow-sm text-xs font-bold text-teal-600 dark:text-teal-400 gap-3 rounded-xl">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.4)]" />
                        {t('liveStatus')}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* KPI Cards */}
                {[
                    { title: tKpi('activeTenants'), value: stats.totalTenants, icon: Building2, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10" },
                    { title: tKpi('uniqueUsers'), value: stats.totalUsers, icon: Users, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-500/10" },
                    { title: tKpi('mau'), value: stats.mau, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                    { title: tKpi('mrr'), value: `$${stats.mrr.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                ].map((kpi, i) => (
                    <Card key={i} className="border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-bold text-slate-500">{kpi.title}</CardTitle>
                            <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                                <kpi.icon className={`h-4 w-4 ${kpi.color}`} aria-hidden="true" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{kpi.value}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <TrendingUp size={10} className="text-emerald-500" aria-hidden="true" />
                                <span className="text-[10px] text-emerald-600 font-bold">+14.2%</span>
                                <span className="text-[10px] text-slate-400 font-semibold opacity-80">{t('growth')}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border border-slate-800 shadow-lg overflow-hidden bg-slate-950 text-white rounded-xl relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full -mr-32 -mt-32 blur-[100px]" />

                    <CardHeader className="pb-8 relative z-10">
                        <CardTitle className="text-xl font-bold flex items-center gap-3 tracking-tight">
                            <ShieldCheck className="text-teal-400 w-6 h-6" aria-hidden="true" />
                            {tQuality('title')}
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium">{tQuality('subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 relative z-10">
                        {stats.performance.rag_quality_avg ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-6">
                                {[
                                    { label: tQuality('faithfulness'), value: stats.performance.rag_quality_avg.avgFaithfulness, color: "bg-teal-500" },
                                    { label: tQuality('relevance'), value: stats.performance.rag_quality_avg.avgRelevance, color: "bg-blue-500" },
                                    { label: tQuality('precision'), value: stats.performance.rag_quality_avg.avgPrecision, color: "bg-indigo-500" },
                                ].map((m, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-slate-500">{m.label}</span>
                                            <span className="text-3xl font-black text-white tabular-nums">{(m.value * 100).toFixed(0)}<span className="text-xs text-slate-500 ml-0.5">%</span></span>
                                        </div>
                                        <Progress value={m.value * 100} indicatorClassName={m.color} className="h-1.5 bg-slate-800 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-14 text-center text-slate-500 font-bold italic border border-dashed border-slate-800 rounded-xl">
                                {tQuality('noData')}
                            </div>
                        )}

                        <div className="pt-8 border-t border-slate-800 flex flex-wrap gap-6">
                            <div className="bg-white/5 p-5 rounded-xl flex-1 min-w-[150px] border border-slate-800 group hover:border-rose-500/30 transition-all shadow-sm">
                                <p className="text-[10px] font-bold text-slate-500 mb-2">{t('sla')}</p>
                                <div className="flex items-end gap-2">
                                    <p className={stats.performance.sla_violations_30d > 0 ? "text-3xl font-black text-rose-500" : "text-3xl font-black text-teal-400"}>
                                        {stats.performance.sla_violations_30d}
                                    </p>
                                    <span className="text-[10px] text-slate-600 font-bold mb-1.5">{t('slaUnit')}</span>
                                </div>
                            </div>
                            <div className="bg-white/5 p-5 rounded-xl flex-1 min-w-[150px] border border-slate-800 group hover:border-amber-500/30 transition-all shadow-sm">
                                <p className="text-[10px] font-bold text-slate-500 mb-2">{t('errors')}</p>
                                <div className="flex items-end gap-2">
                                    <p className={stats.performance.errors_30d > 10 ? "text-3xl font-black text-rose-500" : "text-3xl font-black text-amber-500"}>
                                        {stats.performance.errors_30d}
                                    </p>
                                    <span className="text-[10px] text-slate-600 font-bold mb-1.5">{t('errorsUnit')}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 group overflow-hidden h-full">
                    <CardHeader className="pb-6">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Server className="text-slate-400" aria-hidden="true" /> {tSystem('title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            {[
                                { icon: FileText, label: tSystem('totalOrders'), value: stats.totalCases.toLocaleString(), color: "text-slate-500" },
                                { icon: Search, label: tSystem('ragSearch'), value: stats.usage.searches.toLocaleString(), color: "text-teal-600" },
                                { icon: Zap, label: tSystem('deduplication'), value: `+${Math.round(stats.usage.savings / 1000)}k tkn`, color: "text-amber-500", highlight: true },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-all shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <item.icon size={18} className={item.color} aria-hidden="true" />
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{item.label}</span>
                                    </div>
                                    <span className={`text-sm font-black tabular-nums ${item.highlight ? 'text-teal-600' : 'text-slate-900 dark:text-slate-100'}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <div className="flex items-center gap-4 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/5 p-5 rounded-xl border border-rose-100 dark:border-rose-500/20 shadow-sm group-hover:scale-[1.01] transition-transform">
                                <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg">
                                    <AlertTriangle size={20} className="animate-pulse" aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-tight">{t('anomaly.title')}</p>
                                    <p className="text-xs font-medium text-rose-800/80 dark:text-rose-300/80 mt-0.5">{t('anomaly.desc')}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                            <BarChart3 className="text-teal-500" aria-hidden="true" /> {t('industrial.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <div className="space-y-6">
                            {stats.industries.map((ind, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-500">{ind._id}</span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{ind.count} <span className="text-slate-500 font-medium ml-1">Tenants</span></span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(ind.count / stats.totalTenants) * 100}%` }}
                                                transition={{ duration: 1.5, ease: "circOut", delay: i * 0.1 }}
                                                className="h-full bg-teal-500 rounded-full shadow-sm"
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400 w-8">
                                            {((ind.count / stats.totalTenants) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                            <Building2 className="text-blue-500" aria-hidden="true" /> {tAdopters('title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {stats.recent_tenants.map((t, i) => (
                                <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center font-bold group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700">
                                            {t.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 group-hover:text-teal-600 transition-colors tracking-tight">{t.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{t.industry}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] font-black h-4 px-1.5">{t.subscription?.plan || 'PRO'}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-slate-400 mb-1">{tAdopters('onboarding')}</p>
                                        <p className="text-xs font-mono font-bold text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 flex justify-center border-t border-slate-100 dark:border-slate-800">
                            <Link href="/admin-dashboard/tenants">
                                <Button variant="ghost" size="sm" className="text-[10px] font-bold text-slate-500 hover:text-teal-600 gap-2">
                                    {tAdopters('viewAll')} <ArrowUpRight size={12} aria-hidden="true" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
