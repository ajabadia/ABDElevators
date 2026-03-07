"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Terminal, CheckCircle2, AlertCircle, Loader2, Cpu, BrainCircuit, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { useTranslations } from 'next-intl';

interface TraceEvent {
    message: string;
    confidence?: number;
    findingsCount?: number;
    timestamp: Date;
    status: 'pending' | 'success' | 'error';
}

interface AgentTraceViewerProps {
    correlationId: string;
    jobId?: string; // Optional: can start without jobId if provided by parent later
    onComplete?: () => void;
    onStartRequested?: () => Promise<string | null>; // Callback to trigger analysis and get jobId
}

/**
 * Component visualizing the Agent Reasoning process.
 * Connects via Polling to the analysis status endpoint (BullMQ).
 */
export function AgentTraceViewer({ correlationId, jobId: initialJobId, onComplete, onStartRequested }: AgentTraceViewerProps) {
    const t = useTranslations('technical.agent');
    const [traces, setTraces] = useState<TraceEvent[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
    const [jobId, setJobId] = useState<string | undefined>(initialJobId);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [traces]);

    useEffect(() => {
        // If we start with a jobId, begin polling immediately
        if (initialJobId) {
            startPolling(initialJobId);
        }
        return () => stopPolling();
    }, [initialJobId]);

    const startPolling = (targetJobId: string) => {
        setJobId(targetJobId);
        setIsAnalyzing(true);
        setStatus('running');
        setProgress(10);
        addTrace(t('processing'), 'success');

        pollingInterval.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/technical/entities/analyze/status/${targetJobId}`);
                if (!res.ok) throw new Error("Status check failed");

                const data = await res.json();

                if (data.status === 'completed') {
                    addTrace(t('completed'), 'success');
                    setIsAnalyzing(false);
                    setProgress(100);
                    setStatus('completed');
                    stopPolling();
                    if (onComplete) onComplete();
                } else if (data.status === 'failed') {
                    addTrace(data.error || "Analysis failed", 'error');
                    setIsAnalyzing(false);
                    setStatus('error');
                    stopPolling();
                } else {
                    // Update progress based on state if available
                    // In a more advanced version, we'd have a trace log in the job results
                    setProgress(p => Math.min(p + 2, 95));
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);
    };

    const stopPolling = () => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    };

    const handleStart = async () => {
        if (!onStartRequested) return;

        setTraces([]);
        setIsAnalyzing(true);
        setStatus('running');

        const newJobId = await onStartRequested();
        if (newJobId) {
            startPolling(newJobId);
        } else {
            setIsAnalyzing(false);
            setStatus('error');
            addTrace(t('connectionError'), 'error');
        }
    };

    const addTrace = (message: string, status: 'success' | 'error', confidence?: number, findingsCount?: number) => {
        setTraces(prev => [...prev, {
            message,
            status,
            confidence,
            findingsCount,
            timestamp: new Date()
        }]);
    };

    return (
        <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[500px] font-mono" role="log" aria-live="polite">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
                        <Cpu size={18} className={isAnalyzing ? "animate-pulse" : ""} aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm tracking-tight">{t('title')}</h3>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest">{t('subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isAnalyzing && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/5 rounded-full border border-teal-500/20">
                            <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-ping" aria-hidden="true" />
                            <span className="text-[10px] text-teal-400 font-bold uppercase">{t('processing')}</span>
                        </div>
                    )}
                    {status === 'idle' && (
                        <button
                            onClick={handleStart}
                            className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-lg active:scale-95"
                            aria-label={t('start')}
                        >
                            {t('start')}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar (Visual impact) */}
            <div className="h-1 bg-slate-800 w-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div
                    className="h-full bg-teal-500 transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Console Area */}
            <div
                ref={scrollRef}
                className="flex-1 p-6 overflow-y-auto space-y-3 custom-scrollbar"
            >
                {traces.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50">
                        <BrainCircuit size={48} aria-hidden="true" />
                        <p className="text-sm">{t('waiting')}</p>
                    </div>
                )}

                {traces.map((trace, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex gap-4 animate-in slide-in-from-left-2 duration-300",
                            trace.status === 'error' ? "text-red-400" : "text-slate-300"
                        )}
                    >
                        <div className="flex flex-col items-center gap-1 mt-1">
                            {trace.status === 'success' ? (
                                <CheckCircle2 size={14} className="text-teal-500 shrink-0" aria-hidden="true" />
                            ) : (
                                <AlertCircle size={14} className="text-red-500 shrink-0" aria-hidden="true" />
                            )}
                            {i < traces.length - 1 && <div className="w-[1px] h-full bg-slate-800" aria-hidden="true" />}
                        </div>
                        <div className="space-y-1 pb-4">
                            <div className="flex items-baseline justify-between gap-4">
                                <p className="text-xs leading-relaxed break-words">{trace.message}</p>
                                <span className="text-[9px] text-slate-600 shrink-0">
                                    {trace.timestamp.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>

                            {(trace.confidence !== undefined || trace.findingsCount !== undefined) && (
                                <div className="flex gap-2 pt-1">
                                    {trace.confidence !== undefined && (
                                        <Badge variant="outline" className="text-[9px] border-slate-800 bg-slate-900 text-slate-400">
                                            {t('confidence')}: {(trace.confidence * 100).toFixed(0)}%
                                        </Badge>
                                    )}
                                    {trace.findingsCount !== undefined && trace.findingsCount > 0 && (
                                        <Badge variant="outline" className="text-[9px] border-teal-500/20 bg-teal-500/5 text-teal-400">
                                            {trace.findingsCount} {t('findings')}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isAnalyzing && (
                    <div className="flex gap-4 text-teal-400/50 italic animate-pulse" aria-live="polite">
                        <div className="flex flex-col items-center shrink-0 mt-1">
                            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        </div>
                        <p className="text-[10px]">{t('reasoning')}</p>
                    </div>
                )}
            </div>

            {/* Footer / Stats */}
            <div className="bg-slate-900/50 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1">
                        <Activity size={10} className="text-teal-500" aria-hidden="true" />
                        {t('status')}: <span className="text-slate-300 uppercase">{status}</span>
                    </span>
                    {jobId && (
                        <span className="flex items-center gap-1">
                            Job ID: <span className="text-slate-300">{jobId.slice(0, 12)}...</span>
                        </span>
                    )}
                </div>
                <div className="text-slate-600">
                    Powered by Google Gemini 2.5 Flash
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
            `}</style>
        </div>
    );
}
