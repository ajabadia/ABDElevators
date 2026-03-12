"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable, Column } from "@/components/ui/data-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import {
    Activity,
    Download,
    ShieldAlert,
    Filter,
    HelpCircle,
    Server,
    Clock,
    Zap
} from "lucide-react";
import { InlineHelpPanel } from "@/components/ui/inline-help-panel";
import { AuditMetrics } from "@/components/admin/AuditMetrics";
import { AuditFilters } from "@/components/admin/AuditFilters";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useApiList } from "@/hooks/useApiList";

interface GlobalStats {
    total24h?: number;
    [key: string]: any;
}

interface LogStats {
    errorCount: number;
    warnCount: number;
}

interface LogEntry {
    _id: string;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    source: string;
    action: string;
    message: string;
    correlationId?: string;
    tenantId?: string;
    timestamp: string;
    durationMs?: number;
}

interface AuditClientProps {
    initialGlobalStats?: GlobalStats | null;
    initialLogStats?: LogStats | null;
    initialLogs?: LogEntry[];
}

/**
 * 🔍 AuditClient (Uncodixify 3.0)
 * High-density observability UI with Zero-Waterfall loading.
 */
export function AuditClient({ initialGlobalStats, initialLogStats, initialLogs = [] }: AuditClientProps) {
    const t = useTranslations('admin_logs');
    const searchParams = useSearchParams();
    const tab = searchParams?.get('tab');

    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [showHelp, setShowHelp] = useState(false);

    // Filter Logic
    useEffect(() => {
        if (tab === 'security') {
            setLevelFilter('');
            setSourceFilter('GUARDIAN');
            setSearchQuery('');
        } else if (tab === 'ops') {
            setLevelFilter('');
            setSourceFilter('API_ORDERS');
            setSearchQuery('');
        }
    }, [tab]);

    const hasActiveFilters = Boolean(levelFilter || sourceFilter || searchQuery);
    const actualLevel = levelFilter === '__ALL__' ? '' : levelFilter;
    const actualSource = sourceFilter === '__ALL__' ? '' : sourceFilter;
    const allParam = (levelFilter === '__ALL__' || sourceFilter === '__ALL__') ? '&all=true' : '';

    // Data Fetching (only when filters changed)
    const { data: logs, isLoading: loadingLogs } = useApiList<LogEntry>({
        endpoint: `/api/admin/logs?limit=50&level=${actualLevel}&source=${actualSource}&search=${searchQuery}${allParam}`,
        dataKey: 'logs',
        autoFetch: hasActiveFilters
    });

    const displayLogs = hasActiveFilters ? logs : initialLogs;

    const columns: Column<LogEntry>[] = [
        {
            header: t("table.timestamp"),
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-[10px] text-slate-500 font-bold">
                        {format(new Date(row.timestamp), "HH:mm:ss.SSS")}
                    </span>
                </div>
            )
        },
        {
            header: t("table.source"),
            cell: (row) => (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[9px] font-black uppercase tracking-tighter px-1.5 h-4">
                    {row.source}
                </Badge>
            )
        },
        {
            header: t("table.action"),
            accessorKey: "action",
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-[10px] text-slate-900 dark:text-slate-100 leading-tight">
                        {row.action}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate max-w-[200px]">
                        {row.message}
                    </span>
                </div>
            )
        },
        {
            header: t("table.level"),
            cell: (row) => {
                const colors = {
                    'ERROR': 'bg-rose-500 text-white border-transparent',
                    'WARN': 'bg-amber-400 text-amber-950 border-transparent',
                    'INFO': 'bg-blue-500 text-white border-transparent',
                    'DEBUG': 'bg-slate-200 text-slate-600 border-transparent'
                };
                return (
                    <Badge className={`${colors[row.level] || ''} shadow-none text-[8px] font-black rounded-sm border px-1 h-3.5`}>
                        {row.level}
                    </Badge>
                );
            }
        },
        {
            header: "LATENCY",
            cell: (row) => row.durationMs ? (
                <div className="flex items-center gap-1">
                    <Zap className={`h-3 w-3 ${row.durationMs > 500 ? 'text-amber-500' : 'text-emerald-500'}`} />
                    <span className="font-mono text-[10px] font-bold">{row.durationMs}ms</span>
                </div>
            ) : '-'
        },
        {
            header: "TRACE ID",
            cell: (row) => (
                <span className="font-mono text-[9px] text-slate-400 tracking-tighter hover:text-primary cursor-default transition-colors">
                    {row.correlationId?.split('-')[0] || '-'}
                </span>
            )
        }
    ];

    const sources = useMemo(() => {
        if (!initialLogStats) return [];
        // Extract from stats if available, or just common ones
        return ['GUARDIAN', 'API_CORE', 'LLM_ENGINE', 'WORKFLOW_RUNNER', 'AUTH_PROVIDER'];
    }, [initialLogStats]);

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                highlight="v2.0"
                subtitle="Explorador de observabilidad de alta densidad con carga instantánea."
                helpId="audit-logs"
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/admin/audit/config-changes">
                            <Button variant="outline" className="border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100 text-xs h-9">
                                <ShieldAlert className="mr-2 h-4 w-4" /> Config Audit
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowHelp(!showHelp)}
                            className={showHelp ? "text-primary bg-primary/5" : "text-slate-400"}
                        >
                            <HelpCircle className="h-5 w-5" />
                        </Button>
                        <Button variant="default" className="shadow-lg shadow-primary/10 text-xs h-9 px-4">
                            <Download className="mr-2 h-4 w-4" /> Export logs
                        </Button>
                    </div>
                }
            />

            {showHelp && (
                <div className="mb-6">
                    <InlineHelpPanel contextIds={["audit-logs"]} variant="full" dismissible={true} />
                </div>
            )}

            {/* Quick Stats Header (Uncodixify 3.0 Style) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <ContentCard className="border-none bg-slate-900 text-white shadow-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg">
                            <Activity className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Ops (24h)</p>
                            <h4 className="text-xl font-black">{initialGlobalStats?.total24h?.toLocaleString() || '0'}</h4>
                        </div>
                    </div>
                </ContentCard>

                <ContentCard className="border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 rounded-lg">
                            <ShieldAlert className="h-5 w-5 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anomalies Detected</p>
                            <h4 className="text-xl font-black text-rose-600">{initialLogStats?.errorCount || '0'}</h4>
                        </div>
                    </div>
                </ContentCard>

                <ContentCard className="border-slate-200 p-4 col-span-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Server className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Health</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black">99.98%</span>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Uptime</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                <div key={i} className={`w-1.5 h-6 rounded-full ${i === 4 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                            ))}
                        </div>
                    </div>
                </ContentCard>
            </div>

            {/* View Controls */}
            <div className="mb-4">
               <AuditFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    levelFilter={levelFilter}
                    setLevelFilter={setLevelFilter}
                    sourceFilter={sourceFilter}
                    setSourceFilter={setSourceFilter}
                    logStats={null as any}
                    levels={['ERROR', 'WARN', 'INFO', 'DEBUG']}
                    sources={sources}
                />
            </div>

            {/* Logs Table (High Density) */}
            <ContentCard noPadding={true} className="border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden ring-1 ring-slate-900/5">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">
                            Live Stream Explorer
                        </h3>
                    </div>
                    {hasActiveFilters && (
                        <Badge variant="secondary" className="text-[9px] font-bold h-5">
                            Filtrado: {actualLevel || actualSource || searchQuery}
                        </Badge>
                    )}
                </div>

                <div className="max-h-[600px] overflow-auto">
                    <DataTable
                        columns={columns}
                        data={displayLogs}
                        isLoading={loadingLogs}
                        emptyMessage={t("table.empty")}
                    />
                </div>
            </ContentCard>
        </PageContainer>
    );
}
