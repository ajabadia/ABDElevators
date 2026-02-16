
"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    RotateCcw,
    Trash2,
    AlertCircle,
    ChevronRight,
    Search,
    RefreshCw,
    ShieldAlert
} from 'lucide-react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiList } from '@/hooks/useApiList';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';

type JobStatus = 'active' | 'waiting' | 'completed' | 'failed' | 'delayed';

interface Job {
    id: string;
    state: JobStatus;
    progress: number;
    timestamp: number;
    finishedOn?: number;
    failedReason?: string;
    data: any;
}

export default function ReliabilityDashboardPage() {
    const t = useTranslations('admin.jobs');
    const locale = useLocale();
    const dateLocale = locale === 'es' ? es : enUS;
    const [statusFilter, setStatusFilter] = useState<JobStatus>('failed');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const { data: jobs = [], isLoading, refresh } = useApiList<Job>({
        endpoint: '/api/admin/ingest/jobs',
        filters: { status: statusFilter, trigger: refreshTrigger },
        autoFetch: true,
        dataKey: 'jobs'
    });

    const handleAction = async (jobId: string, action: 'RETRY' | 'DELETE') => {
        try {
            const res = await fetch('/api/admin/ingest/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, action })
            });
            const result = await res.json();
            if (result.success) {
                toast({
                    title: action === 'RETRY' ? t('messages.retry_success') : t('messages.delete_success'),
                    variant: 'default'
                });
                refresh();
            } else {
                throw new Error(result.error?.message || 'Action failed');
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const StatusIcon = ({ status }: { status: JobStatus }) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'failed': return <XCircle className="w-4 h-4 text-rose-500" />;
            case 'active': return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
            case 'waiting': return <Clock className="w-4 h-4 text-amber-500" />;
            default: return <Clock className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight="DLQ"
                subtitle={t('subtitle')}
                actions={
                    <Button variant="outline" size="sm" onClick={() => refresh()} disabled={isLoading}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        {t('actions.refresh') || 'Refresh'}
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
                {(['failed', 'active', 'waiting', 'completed', 'delayed'] as JobStatus[]).map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                            "p-4 rounded-2xl border transition-all text-left group",
                            statusFilter === status
                                ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                : "bg-white border-slate-100 hover:border-slate-200 text-slate-600"
                        )}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <StatusIcon status={status} />
                            <Badge variant={statusFilter === status ? "secondary" : "outline"} className="text-[10px]">
                                {status.toUpperCase()}
                            </Badge>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-70">{t(`status.${status}`)}</p>
                    </button>
                ))}
            </div>

            <ContentCard className="mt-8 overflow-hidden" noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('table.id')}</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('table.type')}</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('table.status')}</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('table.duration')}</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">{t('table.actions') || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {jobs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="flex flex-col items-center opacity-20">
                                            <ShieldAlert size={48} className="mb-4" />
                                            <p className="text-sm font-bold uppercase tracking-widest">No jobs found in this state</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : jobs.map((job) => (
                                <tr key={job.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <span className="font-mono text-[11px] font-bold text-slate-900">{job.id}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-700">{job.data?.type || 'PDF_ANALYSIS'}</span>
                                            <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{job.data?.fileName || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <StatusIcon status={job.state} />
                                            <span className="text-[10px] font-bold uppercase text-slate-600">{t(`status.${job.state}`)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-[11px] text-slate-500 font-medium">
                                        {formatDistanceToNow(job.timestamp, { addSuffix: true, locale: dateLocale })}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {job.state === 'failed' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 rounded-lg border-amber-200 text-amber-600 hover:bg-amber-50"
                                                onClick={() => handleAction(job.id, 'RETRY')}
                                            >
                                                <RotateCcw className="w-3 h-3 mr-1" /> {t('actions.retry')}
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 rounded-lg text-rose-500 hover:bg-rose-50"
                                            onClick={() => handleAction(job.id, 'DELETE')}
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" /> {t('actions.delete')}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ContentCard>

            {jobs.some(j => j.state === 'failed' && j.failedReason) && (
                <div className="mt-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-500 mt-1" />
                        <div>
                            <h4 className="text-sm font-black text-rose-900 uppercase tracking-wider">{t('table.failed_reason')}</h4>
                            <p className="text-xs text-rose-700 mt-2 font-medium leading-relaxed">
                                {jobs.find(j => j.state === 'failed')?.failedReason}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}

