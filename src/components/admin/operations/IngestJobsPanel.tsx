"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Activity, Clock, RotateCcw, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';

// --- Types ---
export type JobStatus = 'active' | 'waiting' | 'completed' | 'failed' | 'delayed';

export interface Job {
    id: string;
    state: JobStatus;
    progress: number;
    timestamp: number;
    finishedOn?: number;
    failedReason?: string;
    data: {
        type?: string;
        fileName?: string;
        tenantId?: string;
        [key: string]: any;
    };
}

// --- Context ---
interface IngestJobsContextValue {
    jobs: Job[];
    onAction: (id: string, action: 'RETRY' | 'DELETE') => void;
}

const IngestJobsContext = createContext<IngestJobsContextValue | undefined>(undefined);

function useIngestJobs() {
    const context = useContext(IngestJobsContext);
    if (!context) {
        throw new Error('IngestJobs components must be wrapped in <IngestJobsPanel />');
    }
    return context;
}

// --- Components ---

/**
 * 🛠️ IngestJobsPanel (Compound Component - Phase 261)
 */
export const IngestJobsPanel = ({
    jobs,
    onAction,
    children,
    className
}: {
    jobs: Job[],
    onAction: (id: string, action: 'RETRY' | 'DELETE') => void,
    children: ReactNode,
    className?: string
}) => {
    return (
        <IngestJobsContext.Provider value={{ jobs, onAction }}>
            <div className={cn("space-y-4", className)}>
                {children}
            </div>
        </IngestJobsContext.Provider>
    );
};

IngestJobsPanel.Header = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
);

IngestJobsPanel.List = ({ className }: { className?: string }) => {
    const { jobs } = useIngestJobs();

    if (jobs.length === 0) {
        return (
            <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">No hay procesos en este estado</p>
            </div>
        );
    }

    return (
        <div className={cn("grid gap-3", className)}>
            {jobs.map(job => (
                <IngestJobCard key={job.id} job={job} />
            ))}
        </div>
    );
};

const IngestJobCard = ({ job }: { job: Job }) => {
    const { onAction } = useIngestJobs();
    const locale = useLocale();
    const dateLocale = locale === 'es' ? es : enUS;

    const StatusIcon = () => {
        switch (job.state) {
            case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'failed': return <XCircle className="w-5 h-5 text-rose-500" />;
            case 'active': return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
            case 'waiting': return <Clock className="w-5 h-5 text-amber-500" />;
            default: return <Clock className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all group">
            <div className="flex items-center gap-4 min-w-0">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                    <StatusIcon />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate max-w-[300px]">
                            {job.data?.fileName || 'Documento sin nombre'}
                        </span>
                        <Badge variant="outline" className="text-[9px] h-4 font-bold border-slate-200 dark:border-slate-800">
                            {job.id.substring(0, 8)}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium italic">
                        <span>{job.data?.type || 'BATCH_PROCESS'}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(job.timestamp, { addSuffix: true, locale: dateLocale })}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {job.state === 'failed' && (
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onAction(job.id, 'RETRY')}
                        className="h-8 text-[10px] font-bold uppercase tracking-wider gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900"
                    >
                        <RotateCcw className="w-3 h-3" /> Reintentar
                    </Button>
                )}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onAction(job.id, 'DELETE')}
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
