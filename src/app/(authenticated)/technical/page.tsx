"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Activity,
    Box,
    Share2,
    Zap,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Network,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '@/components/ui/metric-card';
import { FileText } from 'lucide-react';
import { useApiItem } from '@/hooks/useApiItem';

export default function TechnicalDashboardPage() {
    const t = useTranslations('common.apps.technical');
    const tDash = useTranslations('technical.dashboard');
    const { data: statsData, isLoading, refresh } = useApiItem<{
        entities: { total: string, synced: string, errors: number };
        rag: { latency: string, docs: string, cache: string };
        graph: { nodes: string, edges: string, convergence: string };
    }>({
        endpoint: '/api/technical/stats',
        dataKey: 'stats'
    });

    const stats = statsData || {
        entities: { total: '...', synced: '...', errors: 0 },
        rag: { latency: '...', docs: '...', cache: '...' },
        graph: { nodes: '...', edges: '...', convergence: '...' }
    };

    return (
        <PageContainer className="animate-in fade-in duration-500">
            <PageHeader
                title={t('name')}
                subtitle={t('description')}
                icon={<Zap className="w-6 h-6 text-primary" />}
                actions={
                    <Button variant="outline" size="sm" onClick={() => refresh()} className="rounded-xl border-border">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> {tDash('actions.refresh')}
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-8 mt-6">

                {/* Entidades y Sincronización */}
                <div>
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Box className="w-5 h-5 text-blue-500" />
                        {tDash('entities.title')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard
                            title={tDash('entities.total')}
                            value={isLoading && !statsData ? '...' : stats.entities.total}
                            icon={<Box className="w-5 h-5 text-blue-500" />}
                            trend={tDash('trends.up_this_week', { value: '12' })}
                            trendDirection="up"
                        />
                        <MetricCard
                            title={tDash('entities.synced')}
                            value={isLoading && !statsData ? '...' : stats.entities.synced}
                            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            trend={tDash('trends.optimal')}
                            trendDirection="neutral"
                        />
                        <MetricCard
                            title={tDash('entities.errors')}
                            value={isLoading && !statsData ? '...' : stats.entities.errors.toString()}
                            icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                            trend={tDash('trends.needs_review')}
                            trendDirection="down"
                            variant="warning"
                        />
                    </div>
                </div>

                {/* Motor RAG */}
                <div>
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        {tDash('rag.title')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard
                            title={tDash('rag.latency')}
                            value={isLoading && !statsData ? '...' : stats.rag.latency}
                            icon={<Clock className="w-5 h-5 text-purple-500" />}
                            trend={tDash('trends.down_vs_yesterday', { value: '15' })}
                            trendDirection="down"
                        />
                        <MetricCard
                            title={tDash('rag.docs')}
                            value={isLoading && !statsData ? '...' : stats.rag.docs}
                            icon={<FileText className="w-5 h-5 text-indigo-500" />}
                            trend={tDash('trends.average')}
                            trendDirection="neutral"
                        />
                        <MetricCard
                            title={tDash('rag.cache')}
                            value={isLoading && !statsData ? '...' : stats.rag.cache}
                            icon={<Zap className="w-5 h-5 text-yellow-500" />}
                            trend={tDash('trends.up_this_week', { value: '5%' })}
                            trendDirection="up"
                        />
                    </div>
                </div>

                {/* Grafos de Conocimiento */}
                <div>
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-emerald-500" />
                        {tDash('graph.title')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard
                            title={tDash('graph.nodes')}
                            value={isLoading && !statsData ? '...' : stats.graph.nodes}
                            icon={<Network className="w-5 h-5 text-emerald-500" />}
                            trend={tDash('trends.new', { value: '320' })}
                            trendDirection="up"
                        />
                        <MetricCard
                            title={tDash('graph.edges')}
                            value={isLoading && !statsData ? '...' : stats.graph.edges}
                            icon={<Share2 className="w-5 h-5 text-teal-500" />}
                            trend={tDash('trends.normal_expansion')}
                            trendDirection="neutral"
                        />
                        <MetricCard
                            title={tDash('graph.convergence')}
                            value={isLoading && !statsData ? '...' : stats.graph.convergence}
                            icon={<Activity className="w-5 h-5 text-cyan-500" />}
                            trend={tDash('trends.optimal')}
                            trendDirection="neutral"
                            className="[&_p]:text-lg"
                        />
                    </div>
                </div>

            </div>
        </PageContainer>
    );
}

