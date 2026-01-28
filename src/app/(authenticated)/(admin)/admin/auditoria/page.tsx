"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Clock, FileText, Zap, Download, ArrowUpRight, Search, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

/**
 * AuditoriaPage: Logs & Métricas
 * Fase 7.5: Sistema de Auditoría Avanzado.
 */
export default function AuditoriaPage() {
    const [stats, setStats] = useState({
        totalPedidos: 0,
        tiempoPromedio: 0,
        modelosMasDetectados: [],
        documentosMasConsultados: [],
    });

    return (
        <PageContainer>
            <PageHeader
                title="Registro de Auditoría"
                highlight="Auditoría"
                subtitle="Monitoreo de actividad, seguridad y validación de reglas de negocio."
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
                        <div className="text-sm font-medium">Total Pedidos (24h)</div>
                        <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">127</div>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                            <span className="text-teal-600 font-bold flex items-center mr-1">
                                <ArrowUpRight className="h-3 w-3" /> +12%
                            </span>
                            vs ayer
                        </p>
                    </div>
                </ContentCard>

                <ContentCard className="p-4" noPadding={true}>
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <div className="text-sm font-medium">Tiempo Promedio</div>
                        <Clock className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">3.2s</div>
                        <p className="text-xs text-slate-500 mt-1">Procesamiento RAG</p>
                    </div>
                </ContentCard>

                <ContentCard className="p-4" noPadding={true}>
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <div className="text-sm font-medium">Tokens Consumidos</div>
                        <Zap className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className="text-2xl font-bold font-outfit text-slate-900 dark:text-white">1.2M</div>
                        <p className="text-xs text-slate-500 mt-1">Optimización Vectorial</p>
                    </div>
                </ContentCard>

                <ContentCard className="p-4" noPadding={true}>
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <div className="text-sm font-medium">Precisión Promedio</div>
                        <Activity className="h-4 w-4 text-teal-500" />
                    </div>
                    <div className="p-4 pt-0">
                        <div className="text-2xl font-bold font-outfit text-teal-600">96%</div>
                        <p className="text-xs text-slate-500 mt-1">Validación de Modelos</p>
                    </div>
                </ContentCard>
            </div>

            {/* Logs Table */}
            <ContentCard noPadding={true}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Search className="w-5 h-5 text-slate-400" />
                        Eventos Recientes
                    </h3>
                    <p className="text-sm text-slate-500">Últimas 50 operaciones del sistema RAG</p>
                </div>
                <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                        <TableRow>
                            <TableHead className="font-bold text-slate-900 dark:text-slate-100">Timestamp</TableHead>
                            <TableHead className="font-bold text-slate-900 dark:text-slate-100">Origen</TableHead>
                            <TableHead className="font-bold text-slate-900 dark:text-slate-100">Acción</TableHead>
                            <TableHead className="font-bold text-slate-900 dark:text-slate-100">Nivel</TableHead>
                            <TableHead className="font-bold text-slate-900 dark:text-slate-100">Duración</TableHead>
                            <TableHead className="font-bold text-slate-900 dark:text-slate-100">Correlación ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <TableRow key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                <TableCell className="font-mono text-xs text-slate-500" suppressHydrationWarning>
                                    {new Date().toLocaleString('es-ES')}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        RAG_SERVICE
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-slate-700 dark:text-slate-300">SEARCH</TableCell>
                                <TableCell>
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-none">
                                        INFO
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-slate-500">245ms</TableCell>
                                <TableCell className="font-mono text-xs text-slate-400">
                                    uuid-{i}234-5678
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ContentCard>
        </PageContainer>
    );
}
