"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ShieldCheck, ChevronRight } from "lucide-react";

interface AnalyzeThoughtConsoleProps {
    traces: string[];
    showTraces: boolean;
}

export function AnalyzeThoughtConsole({ traces, showTraces }: AnalyzeThoughtConsoleProps) {
    if (!showTraces || traces.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-950 border-t border-slate-800 overflow-hidden"
            >
                <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                        <Terminal size={12} className="text-teal-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Agente de Verificación en Ejecución
                        </span>
                        <div className="flex-1 h-[1px] bg-slate-900" />
                        <ShieldCheck size={12} className="text-teal-500/50" />
                    </div>
                    <div className="font-mono text-[10px] space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                        {traces.map((trace, i) => (
                            <div key={i} className="flex gap-2 text-slate-400">
                                <ChevronRight size={10} className="mt-0.5 text-teal-900" />
                                <span className={trace.includes('SUCCESS') ? 'text-emerald-500' : trace.includes('ERROR') ? 'text-red-500' : ''}>
                                    {trace}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
