'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Calendar,
    MessageSquare,
    ArrowRight,
    Shield,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WorkflowLog {
    from: string;
    to: string;
    role: string;
    comment?: string;
    signature?: string;
    timestamp: Date | string;
}

interface WorkflowTimelineProps {
    logs: WorkflowLog[];
}

/**
 * WorkflowTimeline: Event timeline for status changes.
 * Professional audit trail visualization.
 */
export const WorkflowTimeline = ({ logs }: WorkflowTimelineProps) => {
    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Clock className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No hay actividad reciente en el workflow.</p>
            </div>
        );
    }

    // Sort logs by timestamp descending
    const sortedLogs = [...logs].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-slate-800">
            {sortedLogs.map((log, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex items-start gap-6"
                >
                    {/* Timeline Dot */}
                    <div className="absolute left-0 mt-1.5 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm z-10">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    </div>

                    <div className="ml-14 flex-1 bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider">
                                    <User className="w-3 h-3" />
                                    {log.role}
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                                    <span className="capitalize">{log.from}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <span className="capitalize">{log.to}</span>
                                </div>
                            </div>
                            <time className="text-xs text-slate-400 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(log.timestamp), "d MMM, yyyy HH:mm", { locale: es })}
                            </time>
                        </div>

                        {log.comment && (
                            <div className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 mb-3">
                                <MessageSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                    "{log.comment}"
                                </p>
                            </div>
                        )}

                        {log.signature && (
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                <Shield className="w-3 h-3 text-emerald-500" />
                                Firma Digital: <span className="opacity-70">{log.signature}</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
