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

export default function TechnicalDashboardPage() {
    const t = useTranslations('apps.technical');
    const tDash = useTranslations('technical.dashboard');
    const [loading, setLoading] = useState(true);

    // Simulated data fetching for KPIs
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <PageContainer className="animate-in fade-in duration-500">
            <PageHeader
                title={t('name')}
                subtitle={t('description')}
                icon={<Zap className="w-6 h-6 text-primary" />}
                actions={
                    <Button variant="outline" size="sm" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800); }} className="rounded-xl border-border">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> {tDash('actions.refresh')}
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
                        <KPICard
                            title={tDash('entities.total')}
                            value="4,281"
                            icon={<Box className="text-blue-500 w-5 h-5" />}
                            trend={tDash('trends.up_this_week', { value: '12' })}
                            loading={loading}
                        />
                        <KPICard
                            title={tDash('entities.synced')}
                            value="98.5%"
                            icon={<CheckCircle2 className="text-emerald-500 w-5 h-5" />}
                            trend={tDash('trends.optimal')}
                            loading={loading}
                        />
                        <KPICard
                            title={tDash('entities.errors')}
                            value="14"
                            icon={<AlertTriangle className="text-amber-500 w-5 h-5" />}
                            trend={tDash('trends.needs_review')}
                            alert
                            loading={loading}
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
                        <KPICard
                            title={tDash('rag.latency')}
                            value="240ms"
                            icon={<Clock className="text-purple-500 w-5 h-5" />}
                            trend={tDash('trends.down_vs_yesterday', { value: '15' })}
                            loading={loading}
                        />
                        <KPICard
                            title={tDash('rag.docs')}
                            value="8.4"
                            icon={<FileTextIcon className="text-indigo-500 w-5 h-5" />}
                            trend={tDash('trends.average')}
                            loading={loading}
                        />
                        <KPICard
                            title={tDash('rag.cache')}
                            value="68%"
                            icon={<Zap className="text-yellow-500 w-5 h-5" />}
                            trend={tDash('trends.up_this_week', { value: '5%' })}
                            loading={loading}
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
                        <KPICard
                            title={tDash('graph.nodes')}
                            value="12,450"
                            icon={<Network className="text-emerald-500 w-5 h-5" />}
                            trend={tDash('trends.new', { value: '320' })}
                            loading={loading}
                        />
                        <KPICard
                            title={tDash('graph.edges')}
                            value="45,892"
                            icon={<Share2 className="text-teal-500 w-5 h-5" />}
                            trend={tDash('trends.normal_expansion')}
                            loading={loading}
                        />
                        <KPICard
                            title={tDash('graph.convergence')}
                            value={tDash('trends.highly_connected')}
                            valueSize="text-lg"
                            icon={<Activity className="text-cyan-500 w-5 h-5" />}
                            trend={tDash('trends.optimal')}
                            loading={loading}
                        />
                    </div>
                </div>

            </div>
        </PageContainer>
    );
}

function KPICard({ title, value, icon, trend, alert = false, loading = false, valueSize = "text-3xl" }: any) {
    if (loading) {
        return (
            <Card className="bg-card/50 backdrop-blur-sm border-border">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-32" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`bg-card/50 backdrop-blur-sm border-border transition-all hover:bg-card hover:shadow-md ${alert ? 'border-amber-500/30 shadow-amber-500/5' : ''}`}>
            <CardContent className="p-6 flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                        <div className="p-2 bg-background rounded-full border border-border">
                            {icon}
                        </div>
                    </div>
                    <div className={`font-black tracking-tight text-foreground ${valueSize}`}>
                        {value}
                    </div>
                </div>
                <div className={`text-xs font-medium mt-4 ${alert ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {trend}
                </div>
            </CardContent>
        </Card>
    );
}

function FileTextIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    )
}
