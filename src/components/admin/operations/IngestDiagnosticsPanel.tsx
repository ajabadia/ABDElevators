"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    FileJson,
    Search,
    Database,
    Share2,
    Check,
    X,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Job } from './IngestJobsPanel';

interface IngestDiagnosticsPanelProps {
    job: Job | null;
    className?: string;
    onRetry?: (id: string) => void;
}

/**
 * 🏥 IngestDiagnosticsPanel (Phase 261)
 * Visual timeline and detailed error breakdown for a document ingestion.
 */
export const IngestDiagnosticsPanel: React.FC<IngestDiagnosticsPanelProps> = ({
    job,
    className,
    onRetry
}) => {
    if (!job) {
        return (
            <div className={cn("flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800", className)}>
                <Activity className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">
                    Selecciona un proceso fallido<br />para ver el diagnóstico
                </p>
            </div>
        );
    }

    const stages = [
        { id: 'REGISTER', label: 'Registro', icon: FileJson },
        { id: 'ANALYZE', label: 'Análisis IA', icon: Search },
        { id: 'INDEX', label: 'Indexación', icon: Database },
        { id: 'GRAPH', label: 'Conexión Graph', icon: Share2 },
    ];

    // Simple heuristic to determine failed stage based on reason
    const getFailedStage = (reason?: string) => {
        if (!reason) return -1;
        const low = reason.toLowerCase();
        if (low.includes('register') || low.includes('database')) return 0;
        if (low.includes('analyze') || low.includes('gemini') || low.includes('llm')) return 1;
        if (low.includes('index') || low.includes('vector') || low.includes('atlas')) return 2;
        if (low.includes('graph') || low.includes('relation')) return 3;
        return 1; // Default to AI analysis if uncertain
    };

    const failedStageIdx = getFailedStage(job.failedReason);

    return (
        <div className={cn("p-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl", className)}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Diagnóstico Técnico</h4>
                        <p className="text-[10px] text-slate-400 font-bold tracking-tight">JOB ID: {job.id}</p>
                    </div>
                </div>
                {onRetry && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRetry(job.id)}
                        className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-xs font-bold"
                    >
                        Intentar Reparar
                    </Button>
                )}
            </div>

            {/* Visual Timeline */}
            <div className="flex items-center justify-between mb-10 px-4">
                {stages.map((stage, idx) => {
                    const isFailed = idx === failedStageIdx;
                    const isSuccess = idx < failedStageIdx;
                    const isPending = idx > failedStageIdx;

                    return (
                        <React.Fragment key={stage.id}>
                            <div className="flex flex-col items-center gap-2 group">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2",
                                    isSuccess && "bg-emerald-50 border-emerald-500 text-emerald-500 dark:bg-emerald-950/30",
                                    isFailed && "bg-rose-50 border-rose-500 text-rose-500 animate-pulse dark:bg-rose-950/30",
                                    isPending && "bg-slate-50 border-slate-200 text-slate-300 dark:bg-slate-900 dark:border-slate-800"
                                )}>
                                    {isSuccess ? <Check className="w-5 h-5" /> :
                                        isFailed ? <X className="w-5 h-5" /> :
                                            <stage.icon className="w-5 h-5" />}
                                </div>
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest",
                                    isSuccess && "text-emerald-600",
                                    isFailed && "text-rose-600",
                                    isPending && "text-slate-400"
                                )}>
                                    {stage.label}
                                </span>
                            </div>
                            {idx < stages.length - 1 && (
                                <div className={cn(
                                    "h-[2px] flex-1 mx-2 rounded-full",
                                    idx < failedStageIdx ? "bg-emerald-500" : "bg-slate-100 dark:bg-slate-800"
                                )} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Error Detail */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Razón del fallo</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                    {job.failedReason || "Error desconocido durante el procesamiento."}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Impacto</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-500 font-bold">Documento no disponible para RAG</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Acción</p>
                        <p className="text-[10px] text-teal-600 font-bold">Verificar conexión LLM / Reintentar</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Re-export type for external use
import { Activity } from 'lucide-react';
