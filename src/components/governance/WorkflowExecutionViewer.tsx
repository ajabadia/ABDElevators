"use client";

import React, { useState } from "react";
import { useApiList } from "@/hooks/useApiList";
import { DataTable, Column } from "@/components/ui/data-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ContentCard } from "@/components/ui/content-card";
import { Workflow, Play, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface WorkflowExecution {
    _id: string;
    workflowId: string;
    workflowName: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    startedAt: string;
    completedAt?: string;
    error?: string;
    durationMs?: number;
}

/**
 * ⚙️ WorkflowExecutionViewer
 * Displays the history of workflow executions (Era 12 observability).
 */
export function WorkflowExecutionViewer() {
    const t = useTranslations('admin_workflows'); // Assuming these keys exist or using fallback

    const { data: executions, isLoading: loading } = useApiList<WorkflowExecution>({
        endpoint: '/api/admin/workflows/executions', // We'll need to create this endpoint
        dataKey: 'executions',
        autoFetch: true
    });

    const columns: Column<WorkflowExecution>[] = [
        {
            header: "Fecha/Hora",
            cell: (row) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {format(new Date(row.startedAt), "dd/MM HH:mm:ss")}
                </span>
            )
        },
        {
            header: "Workflow",
            cell: (row) => <span className="font-bold text-xs">{row.workflowName || row.workflowId}</span>
        },
        {
            header: "Estado",
            cell: (row) => {
                const styles = {
                    'RUNNING': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
                    'COMPLETED': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
                    'FAILED': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400'
                };
                const icons = {
                    'RUNNING': <Clock className="w-3 h-3 mr-1 animate-spin" />,
                    'COMPLETED': <CheckCircle2 className="w-3 h-3 mr-1" />,
                    'FAILED': <XCircle className="w-3 h-3 mr-1" />
                };
                return (
                    <Badge className={`${styles[row.status]} shadow-none text-[10px] font-bold rounded-lg border flex items-center`}>
                        {icons[row.status]}
                        {row.status}
                    </Badge>
                );
            }
        },
        {
            header: "Duración",
            cell: (row) => row.durationMs ? <span className="font-mono text-xs text-muted-foreground">{row.durationMs}ms</span> : '-'
        },
        {
            header: "Error",
            cell: (row) => row.error ? (
                <span className="text-[10px] text-rose-500 font-medium truncate max-w-[200px] block" title={row.error}>
                    {row.error}
                </span>
            ) : '-'
        }
    ];

    return (
        <div className="space-y-6">
            <ContentCard noPadding={true} className="border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Workflow className="w-5 h-5 text-primary" />
                        <div>
                            <h3 className="font-bold text-sm tracking-tight">Ejecuciones de Workflows</h3>
                            <p className="text-[10px] text-muted-foreground font-medium">Historial de trazabilidad y observabilidad procedimental (Era 12)</p>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={executions || []}
                    isLoading={loading}
                    emptyMessage="No se han registrado ejecuciones de workflows."
                />
            </ContentCard>
        </div>
    );
}
