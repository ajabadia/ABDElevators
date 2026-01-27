"use client";

import React, { useEffect, useState } from 'react';
import {
    Users,
    Building2,
    FileText,
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
    Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";

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
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/global-stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data.global);
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar las métricas globales.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <RefreshCw className="animate-spin text-indigo-600 h-10 w-10" />
                <p className="text-slate-500 font-medium animate-pulse text-sm">Calculando métricas globales...</p>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <TrendingUp className="text-indigo-600 w-8 h-8" />
                        Global Platform Insights
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Visión consolidada de salud técnica y métricas de negocio.</p>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-slate-900 px-4 py-2 border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Actualizado: {new Date().toLocaleTimeString()}
                </Badge>
            </div>

            {/* Top KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Tenants Activos", value: stats.totalTenants, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: "Usuarios Únicos", value: stats.totalUsers, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { title: "MAU (30d)", value: stats.mau, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { title: "MRR Estimado", value: `$${stats.mrr.toLocaleString()}`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((kpi, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">{kpi.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${kpi.bg}`}>
                                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{kpi.value}</div>
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">Crecimiento: +12.5% vs mes anterior</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Performance & Quality */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* RAG Quality */}
                <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden bg-slate-900 text-white">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <ShieldCheck className="text-emerald-400" /> RAG Quality Performance (P100)
                        </CardTitle>
                        <CardDescription className="text-slate-400">Promedio de las últimas 100 evaluaciones automáticas del motor.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {stats.performance.rag_quality_avg ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-4">
                                {[
                                    { label: "Faithfulness", value: stats.performance.rag_quality_avg.avgFaithfulness, color: "bg-emerald-500" },
                                    { label: "Answer Relevance", value: stats.performance.rag_quality_avg.avgRelevance, color: "bg-blue-500" },
                                    { label: "Context Precision", value: stats.performance.rag_quality_avg.avgPrecision, color: "bg-indigo-500" },
                                ].map((m, i) => (
                                    <div key={i} className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-bold text-slate-400 uppercase">{m.label}</span>
                                            <span className="text-2xl font-black text-white">{(m.value * 100).toFixed(1)}%</span>
                                        </div>
                                        <Progress value={m.value * 100} indicatorClassName={m.color} className="h-2 bg-slate-800" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center text-slate-500 italic">No hay datos de evaluación suficientes.</div>
                        )}

                        <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-4">
                            <div className="bg-slate-800/50 p-3 rounded-xl flex-1 min-w-[150px]">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Violaciones SLA (30d)</p>
                                <p className={stats.performance.sla_violations_30d > 0 ? "text-xl font-bold text-rose-400" : "text-xl font-bold text-emerald-400"}>
                                    {stats.performance.sla_violations_30d}
                                </p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl flex-1 min-w-[150px]">
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Errores Críticos (30d)</p>
                                <p className={stats.performance.errors_30d > 10 ? "text-xl font-bold text-rose-400" : "text-xl font-bold text-amber-400"}>
                                    {stats.performance.errors_30d}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Operations Load */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Server className="text-slate-400" /> System Load
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-slate-400" />
                                    <span className="text-sm font-medium text-slate-600">Total Pedidos</span>
                                </div>
                                <span className="font-bold">{stats.totalCases.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Search size={16} className="text-slate-400" />
                                    <span className="text-sm font-medium text-slate-600">Búsquedas RAG</span>
                                </div>
                                <span className="font-bold">{stats.usage.searches.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap size={16} className="text-amber-500" />
                                    <span className="text-sm font-medium text-slate-600">Ahorro Deduplicación</span>
                                </div>
                                <span className="font-bold text-emerald-600">+{Math.round(stats.usage.savings / 1000)}k tkn</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl">
                                <AlertTriangle size={20} />
                                <div className="text-xs">
                                    <p className="font-bold">Anomalía Detectada</p>
                                    <p className="opacity-80">Pico de latencia en /api/rag (Tier 2)</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Industrial Distribution & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Industry Breakdown */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-700">
                            <BarChart3 className="text-indigo-400" /> Cuota de Mercado por Industria
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.industries.map((ind, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-24 text-right">
                                        <span className="text-xs font-black text-slate-400 uppercase truncate block">{ind._id}</span>
                                    </div>
                                    <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${(ind.count / stats.totalTenants) * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-8 text-right">
                                        <span className="text-sm font-bold text-slate-700">{ind.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Tenants */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-700">
                            <Building2 className="text-slate-400" /> Tenants Recientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {stats.recent_tenants.map((t, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                            {t.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{t.name}</p>
                                            <p className="text-xs text-slate-500">{t.industry} • Plan {t.subscription?.plan || 'FREE'}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-bold bg-white">
                                        {new Date(t.creado).toLocaleDateString()}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
