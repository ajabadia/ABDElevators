
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Activity,
    RefreshCw,
    Database,
    Zap,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiList } from '@/hooks/useApiList';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { IngestJobsPanel, Job, JobStatus } from '@/components/admin/operations/IngestJobsPanel';
import { IngestDiagnosticsPanel } from '@/components/admin/operations/IngestDiagnosticsPanel';

export default function IngestPage() {
    const t = useTranslations('admin.jobs');
    const [statusFilter, setStatusFilter] = useState<JobStatus>('failed');
    const [kpis, setKpis] = useState<any[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    const { data: jobs = [], isLoading, refresh } = useApiList<Job>({
        endpoint: '/api/admin/ingest/jobs',
        filters: { status: statusFilter },
        autoFetch: true,
        dataKey: 'jobs'
    });

    const fetchKpis = async () => {
        try {
            const res = await fetch('/api/admin/operations/ingest-kpis');
            const result = await res.json();
            if (result.success) setKpis(result.kpis);
        } catch (error) {
            console.error('Error fetching KPIs:', error);
        }
    };

    useEffect(() => {
        fetchKpis();
    }, []);

    const handleAction = async (jobId: string, action: 'RETRY' | 'DELETE') => {
        try {
            const res = await fetch('/api/admin/ingest/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, action })
            });
            const result = await res.json();
            if (result.success) {
                toast.success(action === 'RETRY' ? "Retrying..." : "Deleted");
                refresh();
                fetchKpis();
            } else {
                throw new Error(result.error?.message || 'Action error');
            }
        } catch (error: any) {
            toast.error('Error', { description: error.message });
        }
    };

    const getKpiIcon = (id: string) => {
        switch (id) {
            case 'ingestions_24h': return <Zap className="text-blue-500" size={20} />;
            case 'auto_repair': return <Activity className="text-emerald-500" size={20} />;
            case 'dlq': return <AlertTriangle className="text-amber-500" size={20} />;
            default: return <Database size={20} />;
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title="Ingestion Hub"
                highlight="Clarity"
                subtitle="Simplified management of data processes and RAG system health."
                backHref="/admin/operations"
                actions={
                    <Button variant="outline" size="sm" onClick={() => { refresh(); fetchKpis(); }} disabled={isLoading}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                }
            />

            {/* Block 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {kpis.length > 0 ? kpis.map((kpi) => (
                    <Card key={kpi.id} className="border-none shadow-sm bg-white dark:bg-slate-950 overflow-hidden group hover:shadow-md transition-all">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg group-hover:scale-110 transition-transform">
                                    {getKpiIcon(kpi.id)}
                                </div>
                                <Badge variant="outline" className={cn(
                                    "text-[9px] uppercase",
                                    kpi.status === 'success' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                    kpi.status === 'warning' && "bg-amber-50 text-amber-700 border-amber-200"
                                )}>
                                    {kpi.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="scroll-m-20 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                                {kpi.value}
                            </CardTitle>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{kpi.label}</p>
                            <p className="text-xs text-slate-500 mt-2 font-medium">{kpi.secondary}</p>
                        </CardContent>
                    </Card>
                )) : (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-40 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl" />
                    ))
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                {/* Block 2: Ingest Jobs Panel (Left/Center) */}
                <div className="lg:col-span-2">
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                        {(['failed', 'active', 'waiting', 'completed'] as JobStatus[]).map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    "rounded-full px-5 text-[10px] font-black uppercase tracking-widest transition-all",
                                    statusFilter === status ? "shadow-lg shadow-primary/20" : "bg-white dark:bg-slate-950"
                                )}
                            >
                                {status}
                            </Button>
                        ))}
                    </div>

                    <IngestJobsPanel jobs={jobs} onAction={handleAction}>
                        <div onClick={(e) => {
                            const card = (e.target as HTMLElement).closest('[data-job-id]');
                            if (card) {
                                const jobId = card.getAttribute('data-job-id');
                                const job = jobs.find(j => j.id === jobId);
                                if (job) setSelectedJob(job);
                            }
                        }}>
                            <IngestJobsPanel.List />
                        </div>
                    </IngestJobsPanel>
                </div>

                {/* Block 3: Diagnostics Panel (Right/Sidebar-ish) */}
                <div className="lg:col-span-1">
                    <IngestDiagnosticsPanel
                        job={selectedJob || (statusFilter === 'failed' ? jobs[0] : null)}
                        onRetry={(id) => handleAction(id, 'RETRY')}
                    />

                    <div className="mt-8 p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">System Help</h4>
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <Activity size={16} className="text-teal-400 shrink-0" />
                                <p className="text-[11px] font-medium leading-tight">Failed processes are stored in the DLQ for 7 days.</p>
                            </li>
                            <li className="flex gap-3">
                                <Zap size={16} className="text-teal-400 shrink-0" />
                                <p className="text-[11px] font-medium leading-tight">Use "Retry" to force a new AI analysis if Gemini failed.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
