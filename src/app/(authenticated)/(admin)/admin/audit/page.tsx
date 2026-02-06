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
import { Input } from "@/components/ui/input";
import {
    Activity,
    FileText,
    Zap,
    Download,
    Search,
    ShieldAlert,
    Filter,
    Hash,
    Database,
    Cpu,
    Webhook,
    HelpCircle
} from "lucide-react";
import { InlineHelpPanel } from "@/components/ui/inline-help-panel";

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

/**
 * AuditoriaPage: Registro Industrial & Monitoreo (Fase 96.1)
 * Implementa patrón de Lazy Loading con filtros y búsqueda avanzada.
 */
export default function AuditoriaPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [showHelp, setShowHelp] = useState(false);

    // 🛡️ Pattern: __ALL__ logic
    const hasActiveFilters = Boolean(levelFilter || sourceFilter || searchQuery);
    const actualLevel = levelFilter === '__ALL__' ? '' : levelFilter;
    const actualSource = sourceFilter === '__ALL__' ? '' : sourceFilter;
    const allParam = (levelFilter === '__ALL__' || sourceFilter === '__ALL__') ? '&all=true' : '';

    // 1. Carga de Métricas Globales (Dashboard)
    const { data: globalStats, isLoading: loadingGlobal } = useApiItem<GlobalStats>({
        endpoint: '/api/admin/global-stats',
        dataKey: 'global'
    });

    // 2. Carga de Estadísticas de Logs (Filtros)
    const { data: logStats, isLoading: loadingStats } = useApiItem<LogStats>({
        endpoint: '/api/admin/logs/stats',
        autoFetch: true
    });

    // 3. Carga de Logs (Lazy Loading)
    const { data: logs, isLoading: loadingLogs, refresh: refreshLogs } = useApiList<LogEntry>({
        endpoint: `/api/admin/logs?limit=50&level=${actualLevel}&source=${actualSource}&search=${searchQuery}${allParam}`,
        dataKey: 'logs',
        autoFetch: hasActiveFilters
    });

    // 4. Definición de Columnas
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

    const sources = useMemo(() => {
        if (!logStats?.sources) return [];
        return Object.keys(logStats.sources);
    }, [logStats]);

    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

    return (
        <PageContainer>
            <PageHeader
                title="Registro de Auditoría"
                highlight="Auditoría"
                subtitle="Monitoreo de actividad, seguridad y validación de reglas de negocio en tiempo real."
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowHelp(!showHelp)}
                            className={showHelp ? "text-blue-600 bg-blue-50" : "text-slate-400"}
                        >
                            <HelpCircle className="h-5 w-5" />
                        </Button>
                        <Button variant="outline" className="border-slate-200 dark:border-slate-800">
                            <Download className="mr-2 h-4 w-4" /> Exportar Logs
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

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <ContentCard className="p-4" noPadding={true}>
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pedidos (Total)</div>
                        <FileText className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className="text-2xl font-black font-outfit text-slate-900 dark:text-white">
                            {loadingGlobal ? "..." : globalStats?.totalCases || 0}
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
                        <div className={`text-2xl font-black font-outfit ${globalStats?.performance?.sla_violations_30d ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                            {loadingGlobal ? "..." : globalStats?.performance?.sla_violations_30d || 0}
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
                            {loadingGlobal ? "..." : `${Math.round((globalStats?.usage?.tokens || 0) / 1000)}k`}
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
                            {loadingGlobal ? "..." : globalStats?.performance?.rag_quality_avg ? `${(globalStats.performance.rag_quality_avg.avgFaithfulness * 100).toFixed(0)}%` : "N/A"}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Score de Alucinaciones</p>
                    </div>
                </ContentCard>
            </div>

            {/* Búsqueda y Filtros */}
            <div className="space-y-4 mb-6">
                <ContentCard className="p-2 border-slate-200 dark:border-slate-800 shadow-sm" noPadding>
                    <div className="flex items-center px-4 py-2 gap-4">
                        <Search className="w-5 h-5 text-slate-300" />
                        <Input
                            placeholder="Busca por mensaje, acción, correlationId o email de usuario..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border-none shadow-none focus-visible:ring-0 text-sm font-medium p-0 h-10 placeholder:text-slate-400"
                        />
                    </div>
                </ContentCard>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => {
                            setLevelFilter('__ALL__');
                            setSourceFilter('');
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${levelFilter === '__ALL__'
                            ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-teal-500/50"
                            }`}
                    >
                        <Activity className="w-3 h-3" />
                        TODOS ({logStats?.total || 0})
                    </button>

                    <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />

                    {levels.map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => setLevelFilter(lvl)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2 ${levelFilter === lvl
                                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400"
                                }`}
                        >
                            {lvl}
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${levelFilter === lvl ? "bg-white/20 text-white dark:bg-slate-200 dark:text-slate-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                }`}>
                                {logStats?.levels[lvl] || 0}
                            </span>
                        </button>
                    ))}

                    <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />

                    {sources.map(src => (
                        <button
                            key={src}
                            onClick={() => setSourceFilter(src)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2 ${sourceFilter === src
                                ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-500/50"
                                }`}
                        >
                            {src.toUpperCase()}
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${sourceFilter === src ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                }`}>
                                {logStats?.sources[src] || 0}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Logs Table */}
            <ContentCard noPadding={true} className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                    <div>
                        <h3 className="font-black text-lg flex items-center gap-2 tracking-tight">
                            <Filter className="w-5 h-5 text-teal-500" />
                            Eventos de Auditoría
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feed industrial de operaciones y seguridad</p>
                    </div>
                </div>

                {!hasActiveFilters ? (
                    <div className="p-20 text-center">
                        <div className="bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Activity size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-2 font-outfit">
                            Activa el monitor de auditoría
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 font-medium">
                            Usa los filtros de nivel, origen o la barra de búsqueda para cargar los registros. Elige "TODOS" para ver la actividad general reciente.
                        </p>
                        <div className="flex justify-center gap-3">
                            <Button
                                onClick={() => setLevelFilter('__ALL__')}
                                className="bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl"
                            >
                                <Activity className="w-4 h-4 mr-2" /> Cargar Todos
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setLevelFilter('ERROR')}
                                className="border-slate-200 dark:border-slate-800 font-bold rounded-xl"
                            >
                                <ShieldAlert className="w-4 h-4 mr-2 text-rose-500" /> Solo Errores
                            </Button>
                        </div>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={logs || []}
                        isLoading={loadingLogs}
                        emptyMessage="No se han registrado eventos que coincidan con los filtros."
                    />
                )}
            </ContentCard>
        </PageContainer>
    );
}
