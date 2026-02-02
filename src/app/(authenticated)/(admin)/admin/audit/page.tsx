"use client";

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
    FileText,
    Zap,
    Download,
    Search,
    ShieldAlert
} from "lucide-react";

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

/**
 * AuditoriaPage: Logs & Métricas Reales
 * Fase 7.5: Sistema de Auditoría Avanzado.
 */
export default function AuditoriaPage() {
    // 1. Carga de Métricas Globales
    const { data: stats, isLoading: loadingStats } = useApiItem<GlobalStats>({
        endpoint: '/api/admin/global-stats',
        dataKey: 'global'
    });

    // 2. Carga de Logs Recientes
    const { data: logs, isLoading: loadingLogs } = useApiList<LogEntry>({
        endpoint: '/api/admin/logs',
        dataKey: 'logs',
        filters: { limit: '50' }
    });

    // 3. Definición de Columnas para DataTable
    const columns: Column<LogEntry>[] = [
        {
            header: "Timestamp",
            cell: (row) => (
                <span className="font-mono text-[10px] text-slate-500">
                    {format(new Date(row.timestamp), "dd/MM HH:mm:ss", { locale: es })}
                </span>
            )
        },
        {
            header: "Origen",
            cell: (row) => (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] font-bold">
                    {row.source}
                </Badge>
            )
        },
        {
            header: "Acción",
            accessorKey: "action",
            cell: (row) => <span className="font-black text-[10px] uppercase tracking-tighter">{row.action}</span>
        },
        {
            header: "Nivel",
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
            header: "Duración",
            cell: (row) => row.durationMs ? <span className="font-mono text-[10px] text-slate-500">{row.durationMs}ms</span> : '-'
        },
        {
            header: "Correlación ID",
            cell: (row) => (
                <span className="font-mono text-[9px] text-slate-400 truncate max-w-[100px] block">
                    {row.correlationId || '-'}
                </span>
            )
        }
    ];

    return (
        <PageContainer>
            <PageHeader
                title="Registro de Auditoría"
                highlight="Auditoría"
                subtitle="Monitoreo de actividad, seguridad y validación de reglas de negocio en tiempo real."
                actions={
                    <Button variant="outline" className="border-slate-200 dark:border-slate-800">
                        <Download className="mr-2 h-4 w-4" /> Exportar Logs
                    </Button>
                }
            />

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ContentCard className="p-4" noPadding={true}>
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pedidos (Total)</div>
                        <FileText className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className="text-2xl font-black font-outfit text-slate-900 dark:text-white">
                            {loadingStats ? "..." : stats?.totalCases || 0}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Acumulados en plataforma</p>
                    </div>
                </ContentCard>

                <ContentCard className="p-4" noPadding={true}>
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Incidencias SLA</div>
                        <ShieldAlert className="h-4 w-4 text-rose-400" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className={`text-2xl font-black font-outfit ${stats?.performance?.sla_violations_30d ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                            {loadingStats ? "..." : stats?.performance?.sla_violations_30d || 0}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Últimos 30 días</p>
                    </div>
                </ContentCard>

                <ContentCard className="p-4" noPadding={true}>
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tokens Consumidos</div>
                        <Zap className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className="text-2xl font-black font-outfit text-slate-900 dark:text-white">
                            {loadingStats ? "..." : `${Math.round((stats?.usage?.tokens || 0) / 1000)}k`}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Inferencia LLM Activa</p>
                    </div>
                </ContentCard>

                <ContentCard className="p-4" noPadding={true}>
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">RAG Faithfulness</div>
                        <Activity className="h-4 w-4 text-teal-500" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className="text-2xl font-black font-outfit text-teal-600">
                            {loadingStats ? "..." : stats?.performance?.rag_quality_avg ? `${(stats.performance.rag_quality_avg.avgFaithfulness * 100).toFixed(0)}%` : "N/A"}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Score de Alucinaciones</p>
                    </div>
                </ContentCard>
            </div>

            {/* Logs Table */}
            <ContentCard noPadding={true}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-lg flex items-center gap-2 tracking-tight">
                            <Search className="w-5 h-5 text-slate-300" />
                            Eventos Recientes
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Últimas 50 operaciones del sistema técnico</p>
                    </div>
                    <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200">
                        LIVE FEED
                    </Badge>
                </div>

                <DataTable
                    columns={columns}
                    data={logs || []}
                    isLoading={loadingLogs}
                    emptyMessage="No se han registrado eventos recientes."
                />
            </ContentCard>
        </PageContainer>
    );
}
