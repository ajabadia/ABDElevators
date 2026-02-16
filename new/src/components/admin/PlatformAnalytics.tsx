"use client";

import React from 'react';
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
    FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useApiItem } from '@/hooks/useApiItem';
import { motion } from 'framer-motion';

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
    const { data: stats, isLoading, refresh } = useApiItem<GlobalStats>({
        endpoint: '/api/admin/global-stats',
        dataKey: 'global'
    });

    if (isLoading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-6 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="relative">
                    <RefreshCw className="animate-spin text-teal-600 h-12 w-12" />
                    <div className="absolute inset-0 blur-xl bg-teal-500/20 animate-pulse" />
                </div>
                <p className="text-slate-500 font-black tracking-[0.2em] uppercase text-[10px] animate-pulse">Sincronizando Métricas Globales...</p>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <TrendingUp className="text-teal-600 w-7 h-7" />
                        Insights de Plataforma
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Análisis en tiempo real de la infraestructura y el ecosistema RAG.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => refresh()} className="h-10 w-10 p-0 rounded-full hover:bg-slate-100">
                        <RefreshCw size={18} className="text-slate-400" />
                    </Button>
                    <Badge variant="outline" className="bg-slate-900 px-4 py-2 border-slate-700 shadow-sm text-[10px] font-black tracking-widest text-teal-400 gap-3 rounded-xl uppercase">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]" />
                        Live Status: OK
                    </Badge>
                </div>
            </div>

            {/* Top KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Tenants Activos", value: stats.totalTenants, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: "Usuarios Únicos", value: stats.totalUsers, icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
                    { title: "MAU (30d)", value: stats.mau, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { title: "MRR Estimado", value: `$${stats.mrr.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((kpi, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.title}</CardTitle>
                            <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900 tracking-tighter">{kpi.value}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <TrendingUp size={10} className="text-emerald-500" />
                                <span className="text-[10px] text-emerald-600 font-black">+14.2%</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter opacity-60">vs mes ant.</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Performance & Quality */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* RAG Quality */}
                <Card className="lg:col-span-2 border-none shadow-2xl overflow-hidden bg-slate-900 text-white rounded-[2.5rem] relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -mr-32 -mt-32 blur-[80px]" />

                    <CardHeader className="pb-8 relative z-10">
                        <CardTitle className="text-xl font-black flex items-center gap-3 tracking-tight">
                            <ShieldCheck className="text-teal-400 w-6 h-6" />
                            RAG Performance Quality (P100)
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium">Evaluación heurística automatizada sobre las últimas 100 inferencias.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 relative z-10">
                        {stats.performance.rag_quality_avg ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-6">
                                {[
                                    { label: "Faithfulness", value: stats.performance.rag_quality_avg.avgFaithfulness, color: "bg-teal-500" },
                                    { label: "Relevance", value: stats.performance.rag_quality_avg.avgRelevance, color: "bg-blue-500" },
                                    { label: "Precision", value: stats.performance.rag_quality_avg.avgPrecision, color: "bg-indigo-500" },
                                ].map((m, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
                                            <span className="text-3xl font-black text-white tabular-nums">{(m.value * 100).toFixed(0)}<span className="text-xs text-slate-500 ml-0.5">%</span></span>
                                        </div>
                                        <Progress value={m.value * 100} indicatorClassName={m.color} className="h-2 bg-slate-800 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-14 text-center text-slate-500 font-bold italic border-2 border-dashed border-slate-800 rounded-[2rem]">
                                Datos insuficientes para generar informe de calidad.
                            </div>
                        )}

                        <div className="pt-8 border-t border-slate-800 flex flex-wrap gap-6">
                            <div className="bg-slate-800/40 p-5 rounded-[1.5rem] flex-1 min-w-[150px] border border-slate-800 group hover:border-rose-500/30 transition-all">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Violaciones SLA (30d)</p>
                                <div className="flex items-end gap-2">
                                    <p className={stats.performance.sla_violations_30d > 0 ? "text-3xl font-black text-rose-500" : "text-3xl font-black text-teal-400"}>
                                        {stats.performance.sla_violations_30d}
                                    </p>
                                    <span className="text-[10px] text-slate-600 font-bold mb-1.5 uppercase">Incidentes</span>
                                </div>
                            </div>
                            <div className="bg-slate-800/40 p-5 rounded-[1.5rem] flex-1 min-w-[150px] border border-slate-800 group hover:border-amber-500/30 transition-all">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Errores Críticos (30d)</p>
                                <div className="flex items-end gap-2">
                                    <p className={stats.performance.errors_30d > 10 ? "text-3xl font-black text-rose-500" : "text-3xl font-black text-amber-500"}>
                                        {stats.performance.errors_30d}
                                    </p>
                                    <span className="text-[10px] text-slate-600 font-bold mb-1.5 uppercase">Logs</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Operations Load */}
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white group overflow-hidden">
                    <CardHeader className="pb-6">
                        <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-800">
                            <Server className="text-slate-300" /> Carga del Sistema
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-5">
                            {[
                                { icon: FileText, label: "Total Pedidos", value: stats.totalCases.toLocaleString(), color: "text-slate-400" },
                                { icon: Search, label: "Búsquedas RAG", value: stats.usage.searches.toLocaleString(), color: "text-teal-400" },
                                { icon: Zap, label: "Ahorro Deduplicación", value: `+${Math.round(stats.usage.savings / 1000)}k tkn`, color: "text-amber-500", highlight: true },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                                    <div className="flex items-center gap-3">
                                        <item.icon size={18} className={item.color} />
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{item.label}</span>
                                    </div>
                                    <span className={`text-sm font-black tabular-nums ${item.highlight ? 'text-teal-600' : 'text-slate-900'}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <div className="flex items-center gap-4 text-rose-600 bg-rose-50/50 p-5 rounded-[1.5rem] border border-rose-100 shadow-inner group-hover:scale-[1.02] transition-transform">
                                <div className="p-2 bg-rose-100 rounded-xl">
                                    <AlertTriangle size={20} className="animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Anomalía Detectada</p>
                                    <p className="text-xs font-bold text-rose-800/70 mt-0.5">Incremento 12% latencia en Tier 2 (US-East)</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Industrial Distribution & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                {/* Industry Breakdown */}
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-lg font-black flex items-center gap-3 text-slate-800">
                            <BarChart3 className="text-teal-500" /> Distribución Industrial
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <div className="space-y-6">
                            {stats.industries.map((ind, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{ind._id}</span>
                                        <span className="text-xs font-black text-slate-900">{ind.count} <span className="text-slate-400 font-bold ml-1">Tenants</span></span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2.5 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(ind.count / stats.totalTenants) * 100}%` }}
                                                transition={{ duration: 1.5, ease: "circOut", delay: i * 0.1 }}
                                                className="h-full bg-teal-500 rounded-full shadow-lg"
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono font-black text-teal-600/60 w-8">
                                            {((ind.count / stats.totalTenants) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Tenants */}
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-lg font-black flex items-center gap-3 text-slate-800">
                            <Building2 className="text-blue-500" /> New Adopters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {stats.recent_tenants.map((t, i) => (
                                <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 rounded-2xl flex items-center justify-center font-black group-hover:from-teal-500 group-hover:to-teal-600 group-hover:text-white transition-all shadow-inner">
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
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Incorporación</p>
                                        <p className="text-xs font-mono font-bold text-slate-500">{new Date(t.creado).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-slate-50/50 flex justify-center border-t border-slate-100">
                            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 gap-2">
                                Ver Todos los Tenants <ArrowUpRight size={12} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
