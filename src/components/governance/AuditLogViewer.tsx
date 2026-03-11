"use client";

import React, { useState } from "react";
import { useApiList } from "@/hooks/useApiList";
import { DataTable, Column } from "@/components/ui/data-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ContentCard } from "@/components/ui/content-card";
import { Filter, History } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuditFilters } from "@/components/admin/AuditFilters";
import { useApiItem } from "@/hooks/useApiItem";

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

interface LogStats {
    total: number;
    levels: Record<string, number>;
    sources: Record<string, number>;
}

/**
 * 📜 AuditLogViewer
 * Refactored from AuditClient for the Governance Hub.
 */
export function AuditLogViewer() {
    const t = useTranslations('admin_logs');
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');

    const actualLevel = levelFilter === '__ALL__' ? '' : levelFilter;
    const actualSource = sourceFilter === '__ALL__' ? '' : sourceFilter;

    const { data: logStats } = useApiItem<LogStats>({
        endpoint: '/api/admin/logs/stats',
        autoFetch: true
    });

    const { data: logs, isLoading: loadingLogs } = useApiList<LogEntry>({
        endpoint: `/api/admin/logs?limit=50&level=${actualLevel}&source=${actualSource}&search=${searchQuery}`,
        dataKey: 'logs',
        autoFetch: true
    });

    const columns: Column<LogEntry>[] = [
        {
            header: t("table.timestamp"),
            cell: (row) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {format(new Date(row.timestamp), "dd/MM HH:mm:ss")}
                </span>
            )
        },
        {
            header: t("table.source"),
            cell: (row) => (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold">
                    {row.source}
                </Badge>
            )
        },
        {
            header: t("table.action"),
            accessorKey: "action",
            cell: (row) => <span className="font-bold text-xs">{row.action}</span>
        },
        {
            header: t("table.level"),
            cell: (row) => {
                const colors = {
                    'ERROR': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400',
                    'WARN': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
                    'INFO': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
                    'DEBUG': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                };
                return (
                    <Badge className={`${colors[row.level] || ''} shadow-none text-[10px] font-bold rounded-lg border`}>
                        {row.level}
                    </Badge>
                );
            }
        },
        {
            header: t("table.duration"),
            cell: (row) => row.durationMs ? <span className="font-mono text-xs text-muted-foreground">{row.durationMs}ms</span> : '-'
        },
        {
            header: t("table.correlation"),
            cell: (row) => (
                <span className="font-mono text-[10px] text-muted-foreground/60 truncate max-w-[120px] block">
                    {row.correlationId || '-'}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <AuditFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                levelFilter={levelFilter}
                setLevelFilter={setLevelFilter}
                sourceFilter={sourceFilter}
                setSourceFilter={setSourceFilter}
                logStats={logStats}
                levels={['ERROR', 'WARN', 'INFO', 'DEBUG']}
                sources={logStats?.sources ? Object.keys(logStats.sources) : []}
            />

            <ContentCard noPadding={true} className="border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        <div>
                            <h3 className="font-bold text-sm tracking-tight">{t("table.title")}</h3>
                            <p className="text-[10px] text-muted-foreground font-medium">{t("table.subtitle")}</p>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={logs || []}
                    isLoading={loadingLogs}
                    emptyMessage={t("table.empty")}
                />
            </ContentCard>
        </div>
    );
}
