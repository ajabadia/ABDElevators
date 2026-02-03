"use client";

import React, { useEffect, useState } from 'react';
import {
    Hourglass,
    DollarSign,
    TrendingUp,
    Zap,
    Search,
    FileText,
    RefreshCw,
    PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface RoiStats {
    period: string;
    metrics: {
        analysisCount: number;
        vectorSearches: number;
        dedupEvents: number;
        savedTokens: number;
    };
    roi: {
        totalSavedHours: number;
        estimatedCostSavings: number;
        currency: string;
        breakdown: {
            analysisHours: number;
            searchHours: number;
            dedupHours: number;
        };
    };
    efficiencyScore: number;
}

export function TenantROIStats() {
    const t = useTranslations('admin.roi');
    const [stats, setStats] = useState<RoiStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { data: session } = useSession();

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/usage/roi');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else {
                // If 403, simply don't show component or show empty
                if (res.status === 403) return;
                throw new Error("Failed to fetch ROI stats");
            }
        } catch (err) {
            console.error(err);
            toast({
                title: t('info'),
                description: t('no_data'),
                variant: 'default'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchStats();
        }
    }, [session]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 space-x-2 opacity-50">
                <RefreshCw className="animate-spin h-5 w-5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400">{t('calculating')}</span>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="text-teal-600 h-5 w-5" />
                        {t('title')}
                    </h3>
                    <p className="text-xs text-slate-500">{t('subtitle')}</p>
                </div>
                <Badge variant="outline" className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                    {t('efficiency')}: {stats.efficiencyScore}%
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Main Savings Card */}
                <Card className="col-span-1 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Hourglass className="h-4 w-4" /> {t('time_saved')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tighter">{stats.roi.totalSavedHours}</span>
                            <span className="text-xl font-medium text-slate-400">{t('hours')}</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-medium text-slate-300">
                                <span>{t('cost_savings')}</span>
                                <span className="text-white font-bold">{stats.roi.currency} ${stats.roi.estimatedCostSavings.toLocaleString()}</span>
                            </div>
                            <Progress value={Math.min(100, stats.efficiencyScore)} className="h-2 bg-slate-700" indicatorClassName="bg-teal-500" />
                            <p className="text-[10px] text-slate-400">
                                {t('cost_basis')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Breakdown Card */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm md:col-span-2 lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <PieChart className="h-4 w-4" /> {t('breakdown')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                    <FileText size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{t('ai_analysis')}</p>
                                    <p className="text-[10px] text-slate-500">{stats.metrics.analysisCount} {t('docs')}</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {stats.roi.breakdown.analysisHours}h
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
                                    <Search size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{t('searches')}</p>
                                    <p className="text-[10px] text-slate-500">{stats.metrics.vectorSearches} {t('ops')}</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {stats.roi.breakdown.searchHours}h
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                                    <Zap size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{t('dedup')}</p>
                                    <p className="text-[10px] text-slate-500">{stats.metrics.dedupEvents} {t('files')}</p>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {stats.roi.breakdown.dedupHours}h
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
