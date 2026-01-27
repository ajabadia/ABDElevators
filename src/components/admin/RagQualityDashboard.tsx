"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Target, Search, AlertCircle, FileText, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RagMetricStats {
    faithfulness: number;
    answer_relevance: number;
    context_precision: number;
    count: number;
}

interface RagEvaluation {
    _id: string;
    query: string;
    generation: string;
    metrics: {
        faithfulness: number;
        answer_relevance: number;
        context_precision: number;
    };
    trace?: string[];
    timestamp: string;
    correlacion_id: string;
}

export default function RagQualityDashboard() {
    const [stats, setStats] = useState<RagMetricStats | null>(null);
    const [evaluations, setEvaluations] = useState<RagEvaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEval, setExpandedEval] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch('/api/admin/rag/evaluations');
                const data = await res.json();
                if (data.success) {
                    setStats(data.stats);
                    setEvaluations(data.evaluations);
                }
            } catch (err) {
                console.error("Error fetching metrics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) return <div className="p-8 text-center">Cargando métricas de calidad...</div>;

    const getScoreColor = (score: number) => {
        if (score >= 0.9) return "text-emerald-500";
        if (score >= 0.7) return "text-amber-500";
        return "text-rose-500";
    };

    const getProgressColor = (score: number) => {
        if (score >= 0.9) return "bg-emerald-500";
        if (score >= 0.7) return "bg-amber-500";
        return "bg-rose-500";
    };

    return (
        <div className="space-y-8 p-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-indigo-500" />
                        Observabilidad RAG (RAGAs)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Monitoreo de fidelidad, relevancia y precisión del motor agéntico.
                    </p>
                </div>
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300">
                    <Activity className="w-4 h-4 mr-2" />
                    Basado en 50 últimas sesiones
                </Badge>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Faithfulness (Fidelidad)
                            </CardTitle>
                            <span className={`text-2xl font-bold ${getScoreColor(stats?.faithfulness || 0)}`}>
                                {((stats?.faithfulness || 0) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={(stats?.faithfulness || 0) * 100} className="h-2 mb-2" indicatorClassName={getProgressColor(stats?.faithfulness || 0)} />
                        <p className="text-xs text-slate-400">¿La respuesta está basada en los documentos? (Anti-Alucinación)</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Target className="w-4 h-4" /> Answer Relevance
                            </CardTitle>
                            <span className={`text-2xl font-bold ${getScoreColor(stats?.answer_relevance || 0)}`}>
                                {((stats?.answer_relevance || 0) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={(stats?.answer_relevance || 0) * 100} className="h-2 mb-2" indicatorClassName={getProgressColor(stats?.answer_relevance || 0)} />
                        <p className="text-xs text-slate-400">¿La respuesta resuelve realmente la duda del técnico?</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Search className="w-4 h-4" /> Context Precision
                            </CardTitle>
                            <span className={`text-2xl font-bold ${getScoreColor(stats?.context_precision || 0)}`}>
                                {((stats?.context_precision || 0) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={(stats?.context_precision || 0) * 100} className="h-2 mb-2" indicatorClassName={getProgressColor(stats?.context_precision || 0)} />
                        <p className="text-xs text-slate-400">Calidad de los fragmentos recuperados por el motor vectorial.</p>
                    </CardContent>
                </Card>
            </div>

            {/* List of Evaluations */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" />
                        Historial de Consultas Evaluadas
                    </CardTitle>
                    <CardDescription>Auditoría de calidad y seguimiento del "pensamiento" (Trace) de la IA.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {evaluations.map((ev) => (
                            <div key={ev._id} className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 transition-all">
                                <div className="flex flex-col md:flex-row justify-between gap-4 mb-3">
                                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedEval(expandedEval === ev._id ? null : ev._id)}>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                                            Q: {ev.query}
                                            {ev.trace && ev.trace.length > 0 && <Badge variant="secondary" className="text-[10px] h-4">Trace</Badge>}
                                        </h4>
                                        <p className="text-xs text-slate-500 italic">" {ev.generation.substring(0, 120)}... "</p>
                                    </div>
                                    <div className="flex gap-4 items-center shrink-0">
                                        {/* Metrics Display */}
                                        <div className="text-center">
                                            <div className={`text-xs font-bold ${getScoreColor(ev.metrics.faithfulness)}`}>{(ev.metrics.faithfulness * 100).toFixed(0)}%</div>
                                            <div className="text-[10px] uppercase tracking-wider text-slate-400">Faith</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-xs font-bold ${getScoreColor(ev.metrics.answer_relevance)}`}>{(ev.metrics.answer_relevance * 100).toFixed(0)}%</div>
                                            <div className="text-[10px] uppercase tracking-wider text-slate-400">Rel</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-xs font-bold ${getScoreColor(ev.metrics.context_precision)}`}>{(ev.metrics.context_precision * 100).toFixed(0)}%</div>
                                            <div className="text-[10px] uppercase tracking-wider text-slate-400">Prec</div>
                                        </div>
                                    </div>
                                </div>

                                {expandedEval === ev._id && ev.trace && (
                                    <div className="mt-4 mb-2 p-3 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-emerald-400/90 overflow-x-auto space-y-1 animate-in slide-in-from-top-2 duration-300">
                                        <div className="text-slate-500 mb-2 border-b border-slate-800 pb-1 flex justify-between">
                                            <span>AGENT_TRACE_TERMINAL v2.0</span>
                                            <span>{ev.correlacion_id}</span>
                                        </div>
                                        {ev.trace.map((step, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <span className="text-slate-600">[{idx + 1}]</span>
                                                <span>{step}</span>
                                            </div>
                                        ))}
                                        <div className="text-slate-600 mt-2 italic pt-1 border-t border-slate-800">--- END OF TRACE ---</div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                                    <div className="flex gap-3">
                                        <span>ID: {ev.correlacion_id}</span>
                                        <button
                                            onClick={() => setExpandedEval(expandedEval === ev._id ? null : ev._id)}
                                            className="hover:text-indigo-500 font-medium"
                                        >
                                            {expandedEval === ev._id ? 'Ocultar Trace ↑' : 'Ver Pensamiento Agente (Trace) ↓'}
                                        </button>
                                    </div>
                                    <span>{format(new Date(ev.timestamp), "dd MMM yyyy HH:mm", { locale: es })}</span>
                                </div>
                            </div>
                        ))}

                        {evaluations.length === 0 && (
                            <div className="text-center p-12 text-slate-400 space-y-2">
                                <AlertCircle className="w-12 h-12 mx-auto opacity-20" />
                                <p>No hay evaluaciones registradas aún.</p>
                                <p className="text-xs">Usa el buscador RAG para generar datos de calidad.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
