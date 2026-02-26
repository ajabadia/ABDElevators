"use client";

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from "@/components/ui/metric-card";
import { ContentCard } from "@/components/ui/content-card";
import {
    BrainCircuit,
    TrendingUp,
    Share2,
    MousePointerClick,
    Euro,
    BarChart3,
    Zap,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IntelligenceMetrics } from '@/types/intelligence';
import { ProactiveInsightsSection } from './intelligence/ProactiveInsightsSection';
import { useTranslations } from 'next-intl';

export function CollectiveIntelligenceDashboard() {
    const t = useTranslations('admin.intelligence');
    const [metrics, setMetrics] = useState<IntelligenceMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMetrics = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/core/dashboard/intelligence');
            const data = await res.json();
            if (data.success) {
                setMetrics(data.metrics);
            }
        } catch (error) {
            console.error("Error fetching intelligence metrics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="h-32 bg-muted/50 border-none" />
                ))}
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-muted/30 rounded-3xl border-2 border-dashed border-border transition-colors duration-300">
                <div className="w-16 h-16 bg-card rounded-2xl shadow-sm flex items-center justify-center text-muted-foreground/40">
                    <BrainCircuit size={32} />
                </div>
                <div className="text-center space-y-1">
                    <h4 className="font-bold text-foreground">{t('dashboard.no_data_title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('dashboard.no_data_desc')}</p>
                </div>
                <Button onClick={fetchMetrics} variant="outline" className="gap-2">
                    <RefreshCw size={14} /> {t('dashboard.retry')}
                </Button>
            </div>
        );
    }

    const statCards = [
        {
            title: t('dashboard.semantic_density'),
            subtitle: t('dashboard.nodes_relations'),
            value: metrics.semanticNodes + metrics.semanticRelationships,
            icon: <Share2 />,
            trend: "+12%",
            trendDirection: "up",
            color: "blue"
        },
        {
            title: t('dashboard.learnings'),
            subtitle: t('dashboard.corrections'),
            value: metrics.learnedCorrections,
            icon: <BrainCircuit />,
            trend: t('dashboard.precision', { val: 94 }),
            trendDirection: "up",
            color: "teal"
        },
        {
            title: t('dashboard.automated_tasks'),
            subtitle: t('dashboard.no_intervention'),
            value: metrics.tasksAutomated,
            icon: <Zap />,
            trend: t('dashboard.mins_per_order', { val: 15 }),
            trendDirection: "up",
            color: "amber"
        },
        {
            title: t('dashboard.estimated_roi'),
            subtitle: t('dashboard.accumulated_savings'),
            value: `${Math.round(metrics.estimatedCostSaving)}€`,
            icon: <Euro />,
            trend: t('dashboard.optimization'),
            trendDirection: "up",
            color: "emerald"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Grid de Stats Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => (
                    <MetricCard
                        key={idx}
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                        trend={card.trend}
                        // @ts-ignore
                        trendDirection={card.trendDirection}
                    />
                ))}
            </div>

            {/* Gráficos y Top Entities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ContentCard
                    title={t('dashboard.accuracy_evolution_title')}
                    description={t('dashboard.accuracy_evolution_desc')}
                    className="lg:col-span-2"
                >
                    <div className="h-[200px] flex items-end gap-2 pb-8">
                        {metrics.accuracyTrend.map((point, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-teal-500/20 group-hover:bg-teal-500 transition-all duration-500 rounded-t-lg relative"
                                    style={{ height: `${point}%` }}
                                >
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-teal-600 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {point}%
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-bold">V{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </ContentCard>

                <ContentCard
                    title={t('dashboard.learning_focus_title')}
                    icon={<BarChart3 className="text-teal-500" size={20} />}
                    description={t('dashboard.learning_focus_desc')}
                    className="bg-card border-border"
                >
                    <div className="space-y-4">
                        {metrics.topLearningEntities.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between group p-2 hover:bg-accent rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-teal-600 dark:text-teal-400">
                                        {idx + 1}
                                    </div>
                                    <span className="font-bold text-sm text-foreground capitalize">{item.entity}</span>
                                </div>
                                <Badge className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20">
                                    {item.count}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </ContentCard>
            </div>

            {/* Nueva Sección Proactiva (Fase 83) */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                <ProactiveInsightsSection />
            </div>
        </div>
    );
}
