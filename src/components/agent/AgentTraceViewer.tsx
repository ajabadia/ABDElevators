"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Terminal, CheckCircle2, AlertCircle, Loader2, Cpu, BrainCircuit, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";

interface TraceEvent {
    message: string;
    confidence?: number;
    findingsCount?: number;
    timestamp: Date;
    status: 'pending' | 'success' | 'error';
}

interface AgentTraceViewerProps {
    correlationId: string;
    onComplete?: () => void;
}

/**
 * Component visualizing the Agent Reasoning process.
 * Connects via SSE to the agentic engine to show real-time traces.
 * Refactor for agnostic ontology.
 */
export function AgentTraceViewer({ correlationId, onComplete }: AgentTraceViewerProps) {
    const [traces, setTraces] = useState<TraceEvent[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [traces]);

    const startAnalysis = () => {
        setTraces([]);
        setIsAnalyzing(true);
        setStatus('running');
        setProgress(10);

        // API Route aligned with ontology
        const eventSource = new EventSource(`/api/technical/entities/analyze/${correlationId}`);

        eventSource.addEventListener('status', (e: Event) => {
            const messageEvent = e as MessageEvent;
            const data = JSON.parse(messageEvent.data);
            addTrace(data.message, 'success');
            setProgress(p => Math.min(p + 15, 90));
        });

        eventSource.addEventListener('trace', (e: Event) => {
            const messageEvent = e as MessageEvent;
            const data = JSON.parse(messageEvent.data);
            addTrace(data.message, 'success', data.confidence, data.findingsCount);
        });

        eventSource.addEventListener('complete', (e: Event) => {
            addTrace("Agentic analysis completed successfully.", 'success');
            setIsAnalyzing(false);
            setProgress(100);
            setStatus('completed');
            eventSource.close();
            if (onComplete) onComplete();
        });

        eventSource.addEventListener('error', (e: Event) => {
            try {
                const messageEvent = e as MessageEvent;
                const data = messageEvent.data ? JSON.parse(messageEvent.data) : { message: 'Unknown' };
                addTrace(`Error: ${data.message}`, 'error');
            } catch (err) {
                addTrace(`Agent connection error.`, 'error');
            }
            setIsAnalyzing(false);
            setStatus('error');
            eventSource.close();
        });

        return () => eventSource.close();
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
        <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[500px] font-mono">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
                        <Cpu size={18} className={isAnalyzing ? "animate-pulse" : ""} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm tracking-tight">Agentic Reasoning Engine</h3>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest">LangGraph.js v1.0 • SSE Streaming</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isAnalyzing && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/5 rounded-full border border-teal-500/20">
                            <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-ping" />
                            <span className="text-[10px] text-teal-400 font-bold uppercase">Processing</span>
                        </div>
                    )}
                    {status === 'idle' && (
                        <button
                            onClick={startAnalysis}
                            className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            Start Analysis
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar (Visual impact) */}
            <div className="h-1 bg-slate-800 w-full overflow-hidden">
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
                        <BrainCircuit size={48} />
                        <p className="text-sm">Waiting for instructions to start reasoning...</p>
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
                                <CheckCircle2 size={14} className="text-teal-500 shrink-0" />
                            ) : (
                                <AlertCircle size={14} className="text-red-500 shrink-0" />
                            )}
                            {i < traces.length - 1 && <div className="w-[1px] h-full bg-slate-800" />}
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
                                            Confidence: {(trace.confidence * 100).toFixed(0)}%
                                        </Badge>
                                    )}
                                    {trace.findingsCount !== undefined && trace.findingsCount > 0 && (
                                        <Badge variant="outline" className="text-[9px] border-teal-500/20 bg-teal-500/5 text-teal-400">
                                            {trace.findingsCount} Findings
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isAnalyzing && (
                    <div className="flex gap-4 text-teal-400/50 italic animate-pulse">
                        <div className="flex flex-col items-center shrink-0 mt-1">
                            <Loader2 size={14} className="animate-spin" />
                        </div>
                        <p className="text-[10px]">Agent reasoning...</p>
                    </div>
                )}
            </div>

            {/* Footer / Stats */}
            <div className="bg-slate-900/50 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1">
                        <Activity size={10} className="text-teal-500" />
                        Status: <span className="text-slate-300 uppercase">{status}</span>
                    </span>
                    <span className="flex items-center gap-1">
                        Correlation ID: <span className="text-slate-300">{correlationId.slice(0, 8)}...</span>
                    </span>
                </div>
                <div className="text-slate-600">
                    Powered by Google Gemini 2.0 Flash
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
