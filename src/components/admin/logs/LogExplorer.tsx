"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search, Filter, RefreshCw,
    AlertCircle, AlertTriangle, Info,
    ChevronLeft, ChevronRight, Eye,
    Clock, Terminal, Database, Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LogEntry {
    _id: string;
    nivel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    origen: string;
    accion: string;
    mensaje: string;
    correlacion_id: string;
    tenantId?: string;
    detalles?: any;
    stack?: string;
    timestamp: string;
}

export function LogExplorer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [nivel, setNivel] = useState<string>("");
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                ...(search && { search }),
                ...(nivel && { nivel })
            });
            const res = await fetch(`/api/admin/logs?${params}`);
            const result = await res.json();
            if (result.success) {
                setLogs(result.data);
                setTotalPages(result.pagination.totalPages);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    }, [page, search, nivel]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 5000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs]);

    const getNivelBadge = (nivel: string) => {
        switch (nivel) {
            case 'ERROR': return <Badge variant="destructive" className="gap-1"><AlertCircle size={12} /> ERROR</Badge>;
            case 'WARN': return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 gap-1"><AlertTriangle size={12} /> WARN</Badge>;
            case 'DEBUG': return <Badge variant="secondary" className="gap-1 font-mono"><Terminal size={12} /> DEBUG</Badge>;
            default: return <Badge variant="outline" className="text-slate-500 gap-1"><Info size={12} /> INFO</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Explorador de Logs</h2>
                    <p className="text-muted-foreground">Monitoreo técnico de la plataforma en tiempo real.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={autoRefresh ? "bg-teal-50 border-teal-200 text-teal-700" : ""}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                        {autoRefresh ? "Auto-refresco ON" : "Auto-refresco OFF"}
                    </Button>
                    <Button size="sm" onClick={() => fetchLogs()} disabled={loading}>
                        Actualizar
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="bg-slate-50/50">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Búsqueda rápida</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    placeholder="Mensaje, acción o correlación_id..."
                                    className="pl-10 h-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-48 space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Nivel</label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={nivel}
                                onChange={(e) => setNivel(e.target.value)}
                            >
                                <option value="">Todos los niveles</option>
                                <option value="ERROR">Error</option>
                                <option value="WARN">Warning</option>
                                <option value="INFO">Info</option>
                                <option value="DEBUG">Debug</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 border-b">Tiempo</th>
                                    <th className="px-6 py-3 border-b">Nivel</th>
                                    <th className="px-6 py-3 border-b">Origen / Acción</th>
                                    <th className="px-6 py-3 border-b">Mensaje</th>
                                    <th className="px-6 py-3 border-b text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
                                            Cargando logs...
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            No se encontraron logs con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">
                                                        {format(new Date(log.timestamp), "HH:mm:ss")}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {format(new Date(log.timestamp), "dd MMM yyyy", { locale: es })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getNivelBadge(log.nivel)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-teal-600 uppercase tracking-tight">{log.origen}</span>
                                                    <span className="text-[11px] text-slate-500 font-mono">{log.accion}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-md">
                                                <p className="truncate text-slate-700 font-medium" title={log.mensaje}>
                                                    {log.mensaje}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                                    ID: {log.correlacion_id}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    <Eye size={16} className="text-slate-500" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-slate-50/30 flex items-center justify-between border-t border-slate-100">
                        <p className="text-xs text-slate-500 italic">
                            Mostrando {logs.length} de cientos de eventos.
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <span className="text-xs font-bold px-3 py-1 bg-white border rounded shadow-sm">
                                Página {page} de {totalPages || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modal de Detalle de Log */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Detalles del Evento
                            {selectedLog && getNivelBadge(selectedLog.nivel)}
                        </DialogTitle>
                        <DialogDescription>
                            Trazabilidad completa de la operación y metadatos técnicos.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                        <Clock size={10} /> Timestamp
                                    </p>
                                    <p className="text-sm font-medium">
                                        {format(new Date(selectedLog.timestamp), "dd/MM/yyyy HH:mm:ss.ms")}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                        <Database size={10} /> Correlación ID
                                    </p>
                                    <p className="text-sm font-mono break-all text-teal-600">
                                        {selectedLog.correlacion_id}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Origen</p>
                                    <p className="text-sm font-bold">{selectedLog.origen}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Acción</p>
                                    <p className="text-sm font-mono">{selectedLog.accion}</p>
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Mensaje Completo</p>
                                <div className="p-3 bg-slate-900 rounded-lg">
                                    <p className="text-slate-100 text-sm font-mono leading-relaxed">
                                        {selectedLog.mensaje}
                                    </p>
                                </div>
                            </div>

                            {selectedLog.detalles && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Detalles Adicionales</p>
                                    <pre className="p-3 bg-slate-100 rounded-lg text-[11px] overflow-auto max-h-48 font-mono">
                                        {JSON.stringify(selectedLog.detalles, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.stack && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                        <Shield size={10} /> Stack Trace
                                    </p>
                                    <pre className="p-3 bg-red-50 text-red-900 border border-red-100 rounded-lg text-[10px] overflow-auto max-h-48 font-mono leading-tight whitespace-pre">
                                        {selectedLog.stack}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Loader2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
