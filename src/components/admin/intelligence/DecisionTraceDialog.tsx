"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Activity,
    ShieldCheck,
    AlertTriangle,
    BrainCircuit,
    Search,
    MessageSquare,
    Zap,
    Target
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DecisionTraceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    evaluation: any;
}

/**
 * Dialogo de Traza de Decisión (Fase 120.4)
 * Visualiza el "pensamiento" del sistema RAG y los resultados de evaluación.
 */
export function DecisionTraceDialog({ isOpen, onClose, evaluation }: DecisionTraceDialogProps) {
    const t = useTranslations('admin.rag_quality.trace');

    if (!evaluation) return null;

    const { metrics, causal_analysis, feedback, trace, query, generation, context_chunks } = evaluation;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <DialogHeader className="p-6 pb-2 border-b border-slate-100 dark:border-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <BrainCircuit className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{t('title')}</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400">
                                correlationId: <span className="font-mono text-[10px]">{evaluation.correlationId}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-8 pb-4">
                        {/* 1. Métricas de Calidad */}
                        <section>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                {t('sections.quality')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <MetricCard
                                    label={t('metrics.faithfulness')}
                                    score={metrics?.faithfulness}
                                    icon={<ShieldCheck className="w-4 h-4" />}
                                    color="emerald"
                                />
                                <MetricCard
                                    label={t('metrics.relevance')}
                                    score={metrics?.answer_relevance}
                                    icon={<Target className="w-4 h-4" />}
                                    color="blue"
                                />
                                <MetricCard
                                    label={t('metrics.precision')}
                                    score={metrics?.context_precision}
                                    icon={<Search className="w-4 h-4" />}
                                    color="purple"
                                />
                            </div>
                        </section>

                        {/* 2. Análisis Causal y Feedback */}
                        {causal_analysis && (
                            <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                                <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {t('sections.causal')}
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t('causal.cause')}</p>
                                            <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                                                {causal_analysis.cause_id || 'N/A'}
                                            </Badge>
                                        </div>
                                        <div className="flex-[2]">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t('causal.fix')}</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                                                "{causal_analysis.fix_strategy}"
                                            </p>
                                        </div>
                                    </div>
                                    <Separator className="bg-amber-200/50 dark:bg-amber-800/50" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t('causal.reasoning')}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {feedback}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 3. Traza de Razonamiento (Thought Trace) */}
                        {trace && trace.length > 0 && (
                            <section>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    {t('sections.trace')}
                                </h3>
                                <div className="space-y-3 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                                    {trace.map((step: string, i: number) => (
                                        <div key={i} className="relative pl-6 pb-2">
                                            <div className="absolute left-[-9px] top-1.5 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-950 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 4. Pregunta y Respuesta */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" />
                                    {t('sections.query')}
                                </h3>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm border border-slate-100 dark:border-slate-800 line-clamp-6">
                                    {query}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-emerald-500" />
                                    {t('sections.response')}
                                </h3>
                                <div className="p-4 bg-emerald-500/5 rounded-xl text-sm border border-emerald-500/10 line-clamp-6">
                                    {generation}
                                </div>
                            </div>
                        </section>

                        {/* 5. Contexto Recuperado */}
                        {context_chunks && context_chunks.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                        <Search className="w-4 h-4 text-purple-500" />
                                        {t('sections.context')}
                                    </h3>
                                    <Badge variant="outline" className="text-[10px]">
                                        {context_chunks.length} chunks
                                    </Badge>
                                </div>
                                <div className="space-y-3">
                                    {context_chunks.map((chunk: string, i: number) => (
                                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-[11px] font-mono text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                                            <span className="text-blue-500 mr-2">[{i + 1}]</span> {chunk}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-slate-100 dark:border-slate-900 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                    >
                        {t('actions.close')}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function MetricCard({ label, score, icon, color }: { label: string, score: number, icon: React.ReactNode, color: 'emerald' | 'blue' | 'purple' }) {
    const colorClasses = {
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        purple: "text-purple-500 bg-purple-500/10 border-purple-500/20"
    };

    return (
        <div className={`p-4 rounded-2xl border ${colorClasses[color]} flex flex-col gap-1`}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-tight opacity-70">{label}</span>
                {icon}
            </div>
            <div className="text-2xl font-black">{Math.round((score || 0) * 100)}%</div>
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div
                    className="h-full bg-current transition-all duration-1000 ease-out"
                    style={{ width: `${(score || 0) * 100}%` }}
                />
            </div>
        </div>
    );
}
