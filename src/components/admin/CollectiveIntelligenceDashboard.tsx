"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export function CollectiveIntelligenceDashboard() {
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

    if (isLoading || !metrics) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="h-32 bg-slate-50 dark:bg-slate-900 border-none" />
                ))}
            </div>
        );
    }

    const statCards = [
        {
            title: "Densidad Semántica",
            subtitle: "Nodos + Relaciones",
            value: metrics.semanticNodes + metrics.semanticRelationships,
            icon: <Share2 className="text-blue-500" />,
            trend: "+12% esta semana",
            color: "blue"
        },
        {
            title: "Aprendizajes KIMI",
            subtitle: "Correcciones aprendidas",
            value: metrics.learnedCorrections,
            icon: <BrainCircuit className="text-teal-500" />,
            trend: "94% Precisión",
            color: "teal"
        },
        {
            title: "Tareas Automatizadas",
            subtitle: "Análisis sin intervención",
            value: metrics.tasksAutomated,
            icon: <Zap className="text-amber-500" />,
            trend: "Ahorro: 15min/ped",
            color: "amber"
        },
        {
            title: "Ahorro Estimado",
            subtitle: "ROI Acumulado",
            value: `${Math.round(metrics.estimatedCostSaving)}€`,
            icon: <Euro className="text-emerald-500" />,
            trend: "Optimización continua",
            color: "emerald"
        }
    ];

    return (
        <div className="space-y-6">
            {/* Cabecera del Dashboard */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        Dashboard <span className="text-teal-600">Inteligencia Colectiva</span>
                    </h2>
                    <p className="text-slate-500 text-sm">Rendimiento y evolución del cerebro agéntico en tiempo real.</p>
                </div>
                <button
                    onClick={fetchMetrics}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Grid de Stats Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => (
                    <Card key={idx} className="border-none shadow-xl hover:shadow-2xl transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "p-3 rounded-2xl",
                                    card.color === 'blue' && "bg-blue-50 text-blue-600",
                                    card.color === 'teal' && "bg-teal-50 text-teal-600",
                                    card.color === 'amber' && "bg-amber-50 text-amber-600",
                                    card.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                                )}>
                                    {card.icon}
                                </div>
                                <Badge variant="secondary" className="text-[10px] font-bold">
                                    LIVE
                                </Badge>
                            </div>
                            <div>
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                                    {card.title}
                                </h3>
                                <div className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">
                                    {card.value}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                    <TrendingUp size={12} className="text-emerald-500" />
                                    {card.trend}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Gráficos y Top Entities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Evolución de Precisión (KIMI Agent)</CardTitle>
                        <CardDescription>Aprendizaje continuo basado en feedback humano.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-end gap-2 pb-8">
                        {metrics.accuracyTrend.map((point, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-teal-500/20 group-hover:bg-teal-500 transition-all duration-500 rounded-t-lg relative"
                                    style={{ height: `${point}%` }}
                                >
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {point}%
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">V{i + 1}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-slate-900 text-white">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="text-teal-400" size={20} />
                            Focos de Aprendizaje
                        </CardTitle>
                        <CardDescription className="text-slate-400">Entidades con más correcciones.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {metrics.topLearningEntities.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-teal-400">
                                        {idx + 1}
                                    </div>
                                    <span className="font-bold text-sm capitalize">{item.entity}</span>
                                </div>
                                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                                    {item.count} Aprendizajes
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
