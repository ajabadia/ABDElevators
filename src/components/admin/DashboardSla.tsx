"use client";

import React from "react";
import { ContentCard } from "@/components/ui/content-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Activity, AlertTriangle, CheckCircle, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export interface SlaMetric {
    _id: string; // endpoint
    avgDuration: number;
    maxDuration: number;
    totalRequests: number;
    violations: number;
}

export interface SlaLog {
    id: string;
    timestamp: string | Date;
    durationMs: number;
    level: 'INFO' | 'WARN' | 'ERROR';
    correlationId: string;
}

export function DashboardSla({ days = 7 }: { days?: number }) {
    const t = useTranslations('admin_analytics');
    const [selectedEndpoint, setSelectedEndpoint] = React.useState<string | null>(null);
    const [details, setDetails] = React.useState<SlaLog[]>([]);
    const [loadingDetails, setLoadingDetails] = React.useState(false);

    const [metrics, setMetrics] = React.useState<SlaMetric[]>([]);
    const [lastCheck, setLastCheck] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    const abortControllerRef = React.useRef<AbortController | null>(null);

    const refreshMetrics = React.useCallback(async () => {
        // Cancel previous request
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/audit/sla?days=${days}`, {
                signal: controller.signal
            });
            const data = await res.json();
            if (data.success) {
                setMetrics(data.metrics || []);
                setLastCheck(data.timestamp);
            }
        } catch (e: any) {
            if (e.name === 'AbortError') return;
            console.error('SLA Fetch Error:', e);
        } finally {
            if (abortControllerRef.current === controller) {
                setIsLoading(false);
            }
        }
    }, [days]);

    React.useEffect(() => {
        refreshMetrics();
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, [refreshMetrics]);

    const fetchDetails = async (endpoint: string) => {
        setLoadingDetails(true);
        setSelectedEndpoint(endpoint);
        try {
            const res = await fetch(`/api/admin/audit/sla/details?endpoint=${encodeURIComponent(endpoint)}&days=${days}`);
            const data = await res.json();
            if (data.success) setDetails(data.logs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDetails(false);
        }
    };

    const columns: Column<SlaMetric>[] = [
        {
            header: t('commandCenter.sla.headers.endpoint'),
            accessorKey: "_id",
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold truncate max-w-[300px]">{row._id || 'N/A'}</span>
                </div>
            )
        },
        {
            header: t('commandCenter.sla.headers.avg'),
            cell: (row) => (
                <span className="font-mono text-slate-600">
                    {Math.round(row.avgDuration)}ms
                </span>
            )
        },
        {
            header: t('commandCenter.sla.headers.max'),
            cell: (row) => (
                <span className="font-mono font-bold text-slate-800">
                    {Math.round(row.maxDuration)}ms
                </span>
            )
        },
        {
            header: t('commandCenter.sla.headers.requests'),
            accessorKey: "totalRequests",
            cell: (row) => <span className="text-slate-500">{row.totalRequests}</span>
        },
        {
            header: t('commandCenter.sla.headers.violations'),
            cell: (row) => {
                if (row.violations > 0) {
                    return (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                            <AlertTriangle className="w-3 h-3 mr-1 inline" /> {row.violations}
                        </Badge>
                    );
                }
                return (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle className="w-3 h-3 mr-1 inline" /> {row.violations}
                    </Badge>
                );
            }
        },
        {
            header: "",
            cell: (row) => (
                <button 
                    onClick={() => fetchDetails(row._id)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-primary"
                    title={t('commandCenter.sla.details')}
                >
                    <ArrowUpRight size={18} />
                </button>
            )
        }
    ];

    const hasViolations = metrics?.some(m => m.violations > 0 || m.maxDuration > 1000);

    return (
        <>
            <ContentCard
                title={t('commandCenter.sla.title', { days })}
                subtitle={
                    <div className="flex flex-col gap-1">
                        <span>{t('commandCenter.sla.subtitle')}</span>
                        {lastCheck && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {t('commandCenter.sla.lastCheck', { time: new Date(lastCheck).toLocaleString() })}
                            </span>
                        )}
                    </div>
                }
                icon={<Activity className={`w-5 h-5 ${hasViolations ? 'text-rose-500 animate-pulse' : 'text-teal-600'}`} />}
                noPadding={false}
                className={hasViolations ? "border-rose-200 bg-rose-50/10 shadow-rose-100/50" : "shadow-xl shadow-slate-200/50"}
            >
                {hasViolations && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-3 text-rose-800 text-xs font-bold">
                        <AlertTriangle className="h-4 w-4 animate-bounce" />
                        Proactive Alert: Performance bottlenecks detected in critical endpoints.
                    </div>
                )}
                <div className="mt-4">
                    <DataTable
                        columns={columns}
                        data={metrics || []}
                        isLoading={isLoading}
                        emptyMessage={t('commandCenter.sla.empty')}
                    />
                </div>
            </ContentCard>

            <Dialog open={!!selectedEndpoint} onOpenChange={(open) => !open && setSelectedEndpoint(null)}>
                <DialogContent className="sm:max-w-4xl platform-card">
                    <DialogHeader>
                        <DialogTitle className="platform-title">
                            {t('commandCenter.sla.detailsModal.title', { endpoint: selectedEndpoint || '' })}
                        </DialogTitle>
                        <DialogDescription className="platform-subtitle">
                            {t('commandCenter.sla.detailsModal.subtitle')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6">
                        {loadingDetails ? (
                            <div className="py-20 text-center animate-pulse text-muted-foreground">
                                Analizando trazas de red...
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-auto rounded-xl border border-border">
                                <table className="w-full text-xs font-mono">
                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border sticky top-0">
                                        <tr>
                                            <th scope="col" className="p-3 text-left font-bold text-slate-500 uppercase">{t('commandCenter.sla.detailsModal.table.timestamp')}</th>
                                            <th scope="col" className="p-3 text-left font-bold text-slate-500 uppercase">{t('commandCenter.sla.detailsModal.table.duration')}</th>
                                            <th scope="col" className="p-3 text-left font-bold text-slate-500 uppercase">{t('commandCenter.sla.detailsModal.table.level')}</th>
                                            <th scope="col" className="p-3 text-left font-bold text-slate-500 uppercase">{t('commandCenter.sla.detailsModal.table.correlation')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {details.map((log: SlaLog) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-3 text-slate-600">{new Date(log.timestamp).toLocaleString()}</td>
                                                <td className={`p-3 font-bold ${log.durationMs > 1000 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {log.durationMs}ms
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant="outline" className={log.level === 'ERROR' ? 'bg-rose-50 text-rose-700' : log.level === 'WARN' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'}>
                                                        {log.level}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-slate-400 group relative">
                                                    <span className="truncate block max-w-[150px]">{log.correlationId}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
