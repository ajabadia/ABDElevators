'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    ChevronRight,
    FileText,
    Search,
    Eye,
    ShieldCheck
} from 'lucide-react';
import { WorkflowState, WorkflowTransition } from '@/lib/schemas';
import { cn } from '@/lib/utils';

interface WorkflowStatusBarProps {
    states: WorkflowState[];
    currentStateId: string;
    transitions_history: any[];
}

/**
 * WorkflowStatusBar: Barra de estado premium con estética minimalista.
 * Fase 7.2: Interfaz de Workflows Avanzados.
 */
export const WorkflowStatusBar = ({
    states,
    currentStateId,
    transitions_history
}: WorkflowStatusBarProps) => {

    const currentStateIndex = states.findIndex(s => s.id === currentStateId);

    return (
        <div className="w-full py-6 px-4 mb-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between max-w-5xl mx-auto overflow-x-auto no-scrollbar">
                {states.map((state, index) => {
                    const isCompleted = index < currentStateIndex;
                    const isActive = index === currentStateIndex;
                    const isPending = index > currentStateIndex;

                    const Icon = getIconForState(state.icon || '');

                    return (
                        <React.Fragment key={state.id}>
                            {/* Step Segment */}
                            <div className="flex flex-col items-center group relative min-w-[120px]">
                                {/* Icon Circle */}
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                        backgroundColor: isActive ? state.color : isCompleted ? '#22c55e' : 'transparent',
                                    }}
                                    className={cn(
                                        "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                                        isActive ? "shadow-lg shadow-blue-500/20 ring-4 ring-offset-2 ring-blue-500/10 dark:ring-offset-slate-900" : "border-slate-300 dark:border-slate-700",
                                        isCompleted ? "border-green-500 text-white" : "",
                                        isActive ? "text-white border-transparent" : "text-slate-400"
                                    )}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-6 h-6" />
                                    ) : (
                                        <Icon className={cn("w-6 h-6", isActive ? "animate-pulse" : "")} />
                                    )}
                                </motion.div>

                                {/* Label */}
                                <div className="mt-3 text-center">
                                    <p className={cn(
                                        "text-xs font-semibold tracking-wide uppercase transition-colors duration-300",
                                        isActive ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                                    )}>
                                        {state.label}
                                    </p>
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.span
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 5 }}
                                                className="text-[10px] text-blue-500 font-medium whitespace-nowrap"
                                            >
                                                Estado Actual
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < states.length - 1 && (
                                <div className="flex-1 min-w-[40px] h-[2px] mx-4 bg-slate-200 dark:bg-slate-800 relative translate-y-[-14px]">
                                    <motion.div
                                        initial={{ width: '0%' }}
                                        animate={{ width: isCompleted ? '100%' : '0%' }}
                                        className="absolute inset-0 bg-green-500 transition-all duration-700"
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Mapeo de strings de iconos a componentes Lucide
 */
function getIconForState(iconName: string) {
    switch (iconName) {
        case 'FileText': return FileText;
        case 'Search': return Search;
        case 'Eye': return Eye;
        case 'CheckCircle': return CheckCircle2;
        case 'ShieldCheck': return ShieldCheck;
        case 'AlertCircle': return AlertCircle;
        case 'Clock': return Clock;
        default: return Circle;
    }
}
