"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Target, Search, AlertCircle, FileText, Activity, BrainCircuit } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { DecisionTraceDialog } from './intelligence/DecisionTraceDialog';
import { Button } from '@/components/ui/button';

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
    correlationId: string;
}

export default function RagQualityDashboard() {
    const [stats, setStats] = useState<RagMetricStats | null>(null);
    const [evaluations, setEvaluations] = useState<RagEvaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEval, setExpandedEval] = useState<string | null>(null);
    const [selectedEval, setSelectedEval] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const t = useTranslations('admin.rag_quality');
    const locale = useLocale();
    const dateLocale = locale === 'es' ? es : enUS;

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

    if (loading) return <div className="p-8 text-center">{t('loading')}</div>;

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
                        {t('dashboard_title')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('dashboard_desc')}
                    </p>
                </div>
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300">
                    <Activity className="w-4 h-4 mr-2" />
                    {t('latest_sessions', { count: evaluations.length })}
                </Badge>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> {t('metrics.faithfulness.label')}
                            </CardTitle>
                            <span className={`text-2xl font-bold ${getScoreColor(stats?.faithfulness || 0)}`}>
                                {((stats?.faithfulness || 0) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={(stats?.faithfulness || 0) * 100} className="h-2 mb-2" indicatorClassName={getProgressColor(stats?.faithfulness || 0)} />
                        <p className="text-xs text-slate-400">{t('metrics.faithfulness.desc')}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Target className="w-4 h-4" /> {t('metrics.relevance.label')}
                            </CardTitle>
                            <span className={`text-2xl font-bold ${getScoreColor(stats?.answer_relevance || 0)}`}>
                                {((stats?.answer_relevance || 0) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={(stats?.answer_relevance || 0) * 100} className="h-2 mb-2" indicatorClassName={getProgressColor(stats?.answer_relevance || 0)} />
                        <p className="text-xs text-slate-400">{t('metrics.relevance.desc')}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Search className="w-4 h-4" /> {t('metrics.precision.label')}
                            </CardTitle>
                            <span className={`text-2xl font-bold ${getScoreColor(stats?.context_precision || 0)}`}>
                                {((stats?.context_precision || 0) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={(stats?.context_precision || 0) * 100} className="h-2 mb-2" indicatorClassName={getProgressColor(stats?.context_precision || 0)} />
                        <p className="text-xs text-slate-400">{t('metrics.precision.desc')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* List of Evaluations */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" />
                        {t('history.title')}
                    </CardTitle>
                    <CardDescription>{t('history.desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {evaluations.map((ev) => (
                            <div key={ev._id} className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 transition-all">
                                <div className="flex flex-col md:flex-row justify-between gap-4 mb-3">
                                    <div
                                        className="flex-1 cursor-pointer"
                                        onClick={() => setExpandedEval(expandedEval === ev._id ? null : ev._id)}
                                        role="button"
                                        aria-expanded={expandedEval === ev._id}
                                        aria-label={expandedEval === ev._id ? t('history.hide_trace') : t('history.show_trace')}
                                    >
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
                                            <span>{t('history.trace_terminal')}</span>
                                            <span>{ev.correlationId}</span>
                                        </div>
                                        {ev.trace.map((step, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <span className="text-slate-600">[{idx + 1}]</span>
                                                <span>{step}</span>
                                            </div>
                                        ))}
                                        <div className="text-slate-600 mt-2 italic pt-1 border-t border-slate-800">{t('history.trace_end')}</div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                                    <div className="flex gap-3">
                                        <span>ID: {ev.correlationId}</span>
                                        <button
                                            onClick={() => setExpandedEval(expandedEval === ev._id ? null : ev._id)}
                                            className="hover:text-indigo-500 font-medium"
                                            aria-expanded={expandedEval === ev._id}
                                        >
                                            {expandedEval === ev._id ? t('history.hide_trace') : t('history.show_trace')}
                                        </button>
                                        <div className="w-[1px] h-3 bg-slate-200 dark:bg-slate-800" />
                                        <button
                                            onClick={() => {
                                                setSelectedEval(ev);
                                                setIsDialogOpen(true);
                                            }}
                                            className="text-blue-500 hover:text-blue-600 font-bold flex items-center gap-1"
                                        >
                                            <BrainCircuit className="w-3 h-3" />
                                            {t('trace.actions.audit')}
                                        </button>
                                    </div>
                                    <span>{format(new Date(ev.timestamp), "dd MMM yyyy HH:mm", { locale: dateLocale })}</span>
                                </div>
                            </div>
                        ))}

                        {evaluations.length === 0 && (
                            <div className="text-center p-12 text-slate-400 space-y-2">
                                <AlertCircle className="w-12 h-12 mx-auto opacity-20" />
                                <p>{t('history.empty')}</p>
                                <p className="text-xs">{t('history.empty_desc')}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <DecisionTraceDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                evaluation={selectedEval}
            />
        </div>
    );
}
