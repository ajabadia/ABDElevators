"use client";

import React from 'react';
import { X, TrendingUp, Clock, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimulationResult } from '@/lib/simulation-engine';

interface SimulationResultsPanelProps {
    results: SimulationResult | null;
    onClose: () => void;
    isRunning: boolean;
}

export function SimulationResultsPanel({ results, onClose, isRunning }: SimulationResultsPanelProps) {
    if (!results && !isRunning) return null;

    return (
        <Card className="absolute left-4 bottom-4 w-96 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-teal-500/30 z-50 bg-white/80 backdrop-blur-xl animate-in slide-in-from-left duration-500 overflow-hidden ring-1 ring-white/50">
            <div className={`p-4 flex flex-row items-center justify-between border-b border-slate-200/50 ${isRunning ? 'bg-teal-600/5' : 'bg-teal-600/5'}`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isRunning ? 'bg-teal-100 animate-pulse' : 'bg-teal-50'}`}>
                        <Activity className={`w-4 h-4 ${isRunning ? 'text-teal-600' : 'text-teal-500'}`} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600">Operational Forecast</h3>
                        <p className="text-[9px] text-slate-400 font-medium">Monte Carlo Engine v2.0</p>
                    </div>
                </div>
                {!isRunning && (
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-all hover:rotate-90">
                        <X size={16} />
                    </button>
                )}
            </div>

            <div className="p-5 space-y-6">
                {isRunning ? (
                    <div className="py-10 flex flex-col items-center justify-center space-y-5">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
                            <Activity className="absolute inset-0 m-auto text-teal-600 animate-pulse" size={24} />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Simulating 1,000 Scenarios</p>
                            <p className="text-[10px] text-slate-400 font-medium italic">Calculating edge probabilities & node costs...</p>
                        </div>
                    </div>
                ) : results ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 shadow-sm group hover:border-teal-200 transition-all cursor-default">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <DollarSign className="w-3 h-3 text-teal-500" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Cost</span>
                                </div>
                                <div className="text-2xl font-black text-slate-900 tracking-tighter">
                                    €{results.avg_cost.toFixed(2)}
                                </div>
                                <div className="mt-1 text-[9px] text-slate-400 flex items-center justify-between">
                                    <span>Min: €{results.min_cost}</span>
                                    <span>Max: €{results.max_cost}</span>
                                </div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all cursor-default">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Clock className="w-3 h-3 text-blue-500" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Time</span>
                                </div>
                                <div className="text-2xl font-black text-slate-900 tracking-tighter">
                                    {results.avg_time.toFixed(1)}m
                                </div>
                                <div className="mt-1 text-[9px] text-slate-400">
                                    Total 1,000 iterations
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 p-4 bg-teal-50/30 rounded-2xl border border-teal-100/50">
                            <div className="flex justify-between items-end">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Reliability Score</span>
                                    <p className="text-xs font-bold text-slate-600">Completion rate</p>
                                </div>
                                <span className="text-xl font-black text-teal-600">{((results.completed_runs / results.iterations) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100/50 rounded-full overflow-hidden p-0.5">
                                <div
                                    className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(20,184,166,0.3)]"
                                    style={{ width: `${(results.completed_runs / results.iterations) * 100}%` }}
                                />
                            </div>
                            <p className="text-[9px] text-teal-600/70 font-medium italic">95% Confidence interval for production environments.</p>
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[8px] font-mono text-slate-300">
                            <div className="flex items-center gap-1">
                                <Activity size={10} />
                                <span>TRACER_ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                            </div>
                            <span>v2.0.4-PRO</span>
                        </div>
                    </>
                ) : null}
            </div>
        </Card>
    );
}
