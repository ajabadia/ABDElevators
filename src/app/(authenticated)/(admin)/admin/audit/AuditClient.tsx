"use client";

import React, { useState, useMemo } from "react";
import { useApiItem } from "@/hooks/useApiItem";
import { useApiList } from "@/hooks/useApiList";
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
    HelpCircle
} from "lucide-react";
import { InlineHelpPanel } from "@/components/ui/inline-help-panel";
import { AuditMetrics } from "@/components/admin/AuditMetrics";
import { AuditFilters } from "@/components/admin/AuditFilters";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface GlobalStats {
    totalTenants: number;
    totalUsers: number;
    totalFiles: number;
    totalCases: number;
    performance: {
        sla_violations_30d: number;
        errors_30d: number;
        rag_quality_avg: {
            avgFaithfulness: number;
            avgRelevance: number;
            avgPrecision: number;
        } | null;
    };
    usage: {
        tokens: number;
        storage: number;
        searches: number;
        savings: number;
    };
}

interface LogStats {
    total: number;
    levels: Record<string, number>;
    sources: Record<string, number>;
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

export function AuditClient() {
    const t = useTranslations("admin.audit");

    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [showHelp, setShowHelp] = useState(false);

    const hasActiveFilters = Boolean(levelFilter || sourceFilter || searchQuery);
    const actualLevel = levelFilter === '__ALL__' ? '' : levelFilter;
    const actualSource = sourceFilter === '__ALL__' ? '' : sourceFilter;
    const allParam = (levelFilter === '__ALL__' || sourceFilter === '__ALL__') ? '&all=true' : '';

    const { data: globalStats, isLoading: loadingGlobal } = useApiItem<GlobalStats>({
        endpoint: '/api/admin/global-stats',
        dataKey: 'global'
    });

    const { data: logStats } = useApiItem<LogStats>({
        endpoint: '/api/admin/logs/stats',
        autoFetch: true
    });

    const { data: logs, isLoading: loadingLogs } = useApiList<LogEntry>({
        endpoint: `/api/admin/logs?limit=50&level=${actualLevel}&source=${actualSource}&search=${searchQuery}${allParam}`,
        dataKey: 'logs',
        autoFetch: hasActiveFilters
    });

    const columns: Column<LogEntry>[] = [
        {
            header: t("table.timestamp"),
            cell: (row) => (
                <span className="font-mono text-[10px] text-slate-500">
                    {format(new Date(row.timestamp), "dd/MM HH:mm:ss", { locale: es })}
                </span>
            )
        },
        {
            header: t("table.source"),
            cell: (row) => (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] font-bold">
                    {row.source}
                </Badge>
            )
        },
        {
            header: t("table.action"),
            accessorKey: "action",
            cell: (row) => <span className="font-black text-[10px] uppercase tracking-tighter">{row.action}</span>
        },
        {
            header: t("table.level"),
            cell: (row) => {
                const colors = {
                    'ERROR': 'bg-rose-100 text-rose-700 border-rose-200',
                    'WARN': 'bg-amber-100 text-amber-700 border-amber-200',
                    'INFO': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    'DEBUG': 'bg-slate-100 text-slate-700 border-slate-200'
                };
                return (
                    <Badge className={`${colors[row.level] || ''} shadow-none text-[9px]`}>
                        {row.level}
                    </Badge>
                );
            }
        },
        {
            header: t("table.duration"),
            cell: (row) => row.durationMs ? <span className="font-mono text-[10px] text-slate-500">{row.durationMs}ms</span> : '-'
        },
        {
            header: t("table.correlation"),
            cell: (row) => (
                <span className="font-mono text-[9px] text-slate-400 truncate max-w-[100px] block">
                    {row.correlationId || '-'}
                </span>
            )
        }
    ];

    const sources = useMemo(() => {
        if (!logStats?.sources) return [];
        return Object.keys(logStats.sources);
    }, [logStats]);

    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                highlight={t("highlight")}
                subtitle={t("subtitle")}
                helpId="audit-logs"
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/admin/audit/config-changes">
                            <Button variant="secondary" className="bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-100 border border-amber-200 dark:border-amber-800">
                                <ShieldAlert className="mr-2 h-4 w-4" /> {t("config_button")}
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowHelp(!showHelp)}
                            className={showHelp ? "text-blue-600 bg-blue-50" : "text-slate-400"}
                        >
                            <HelpCircle className="h-5 w-5" />
                        </Button>
                        <Button variant="outline" className="border-slate-200 dark:border-slate-800">
                            <Download className="mr-2 h-4 w-4" /> {t("export_button")}
                        </Button>
                    </div>
                }
            />

            {showHelp && (
                <InlineHelpPanel
                    contextIds={["audit-logs"]}
                    variant="full"
                    dismissible={true}
                />
            )}

            {/* Metrics Dashboard (Modular) */}
            <AuditMetrics stats={globalStats} isLoading={loadingGlobal} />

            {/* Búsqueda y Filtros (Modular) */}
            <AuditFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                levelFilter={levelFilter}
                setLevelFilter={setLevelFilter}
                sourceFilter={sourceFilter}
                setSourceFilter={setSourceFilter}
                logStats={logStats}
                levels={levels}
                sources={sources}
            />

            {/* Logs Table */}
            <ContentCard noPadding={true} className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                    <div>
                        <h3 className="font-black text-lg flex items-center gap-2 tracking-tight">
                            <Filter className="w-5 h-5 text-teal-500" />
                            {t("table.title")}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("table.subtitle")}</p>
                    </div>
                </div>

                {!hasActiveFilters ? (
                    <div className="p-20 text-center">
                        <div className="bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Activity size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-2 font-outfit">
                            {t("empty_state.title")}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 font-medium">
                            {t("empty_state.description")}
                        </p>
                        <div className="flex justify-center gap-3">
                            <Button
                                onClick={() => setLevelFilter('__ALL__')}
                                className="bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl"
                            >
                                <Activity className="w-4 h-4 mr-2" /> {t("empty_state.load_all")}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setLevelFilter('ERROR')}
                                className="border-slate-200 dark:border-slate-800 font-bold rounded-xl"
                            >
                                <ShieldAlert className="w-4 h-4 mr-2 text-rose-500" /> {t("filters.errors_only")}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={logs || []}
                        isLoading={loadingLogs}
                        emptyMessage={t("table.empty")}
                    />
                )}
            </ContentCard>
        </PageContainer>
    );
}
