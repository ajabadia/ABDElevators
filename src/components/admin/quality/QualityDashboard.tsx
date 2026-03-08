"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Zap, BookOpen, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface QualityDashboardProps {
    stats: {
        avgFaithfulness: number;
        avgRelevance: number;
        avgPrecision: number;
        totalEvaluations: number;
        hallucinationCount: number;
    };
    manuals: Array<{
        assetId: string;
        assetName: string;
        avgRelevance: number;
        queriesCount: number;
    }>;
}

export function QualityDashboard({ stats, manuals }: QualityDashboardProps) {
    const t = useTranslations('admin.quality_insights');

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-500';
        if (score >= 70) return 'text-amber-500';
        return 'text-destructive';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-primary" />
                            {t('dashboard.faithfulness')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <span className={`text-3xl font-bold ${getScoreColor(stats.avgFaithfulness * 100)}`}>
                                {(stats.avgFaithfulness * 100).toFixed(1)}%
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                                {t('dashboard.samples', { count: stats.totalEvaluations })}
                            </Badge>
                        </div>
                        <Progress value={stats.avgFaithfulness * 100} className="h-1 mt-4" />
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            {t('dashboard.relevance')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {(stats.avgRelevance * 100).toFixed(1)}%
                        </div>
                        <Progress value={stats.avgRelevance * 100} className="h-1 mt-4" />
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            {t('dashboard.hallucinations')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-destructive">
                            {stats.hallucinationCount}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                            {t('dashboard.critical_hint')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/10">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {t('manuals.title')}
                    </CardTitle>
                    <CardDescription>
                        {t('manuals.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {manuals.map((m) => (
                            <div key={m.assetId} className="flex items-center justify-between p-3 rounded-lg bg-accent/20 border border-border/50">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium truncate max-w-[300px]">{m.assetName}</p>
                                    <p className="text-[10px] text-muted-foreground">{t('manuals.queries_count', { count: m.queriesCount })}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${getScoreColor(m.avgRelevance * 100)}`}>
                                            {(m.avgRelevance * 100).toFixed(1)}%
                                        </p>
                                        <p className="text-[10px] text-muted-foreground italic">{t('manuals.avg_relevance')}</p>
                                    </div>
                                    <TrendingUp className={`h-4 w-4 ${m.avgRelevance > 0.8 ? 'text-emerald-500' : 'text-destructive'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
