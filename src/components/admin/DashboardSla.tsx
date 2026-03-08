"use client";

import React from "react";
import { useApiList } from "@/hooks/useApiList";
import { ContentCard } from "@/components/ui/content-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SlaMetric {
    _id: string; // endpoint
    avgDuration: number;
    maxDuration: number;
    totalRequests: number;
    violations: number;
}

export function DashboardSla({ days = 7 }: { days?: number }) {
    const { data: metrics, isLoading } = useApiList<SlaMetric>({
        endpoint: `/api/admin/audit/sla?days=${days}`,
        dataKey: 'metrics',
        autoFetch: true
    });

    const columns: Column<SlaMetric>[] = [
        {
            header: "Endpoint",
            accessorKey: "_id",
            cell: (row) => <span className="font-mono text-xs font-bold">{row._id || 'N/A'}</span>
        },
        {
            header: "Avg Duration",
            cell: (row) => (
                <span className="font-mono text-slate-600">
                    {Math.round(row.avgDuration)}ms
                </span>
            )
        },
        {
            header: "Max Duration",
            cell: (row) => (
                <span className="font-mono font-bold text-slate-800">
                    {Math.round(row.maxDuration)}ms
                </span>
            )
        },
        {
            header: "Requests",
            accessorKey: "totalRequests",
            cell: (row) => <span className="text-slate-500">{row.totalRequests}</span>
        },
        {
            header: "SLA Violations",
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
        }
    ];

    return (
        <ContentCard
            title={`SLA & Rendimiento de API (${days} días)`}
            subtitle="Monitorización automática de tiempos de respuesta y violaciones de SLA."
            icon={<Activity className="w-5 h-5 text-teal-600" />}
            noPadding={false}
        >
            <div className="mt-4">
                <DataTable
                    columns={columns}
                    data={metrics || []}
                    isLoading={isLoading}
                    emptyMessage="No se han registrado métricas SLA en el periodo seleccionado."
                />
            </div>
        </ContentCard>
    );
}
