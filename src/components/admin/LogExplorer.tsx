"use client";

import React, { useState, useEffect } from 'react';
import {
    Search, AlertTriangle, AlertCircle, Info, CheckCircle,
    Download, RefreshCw, Filter, Calendar, Server, Activity, Bug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Definición de tipos para los logs
interface LogEntry {
    _id: string;
    nivel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    origen: string;
    accion: string;
    mensaje: string;
    correlacion_id: string;
    tenantId?: string;
    timestamp: string;
    detalles?: any;
    stack?: string;
}

interface User { _id: string; email: string; nombre: string; }
interface Tenant { tenantId: string; name: string; }

export default function LogExplorer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ errorCount: 0, warnCount: 0 });

    // Listas para dropdowns
    const [users, setUsers] = useState<User[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);

    // Filtros
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState<'ALL' | 'ERROR' | 'WARN' | 'INFO'>('ALL');
    const [originFilter, setOriginFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [tenantFilter, setTenantFilter] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(false);

    // Selección para detalle
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

    // Cargar listas de filtrado al montar
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [usersRes, tenantsRes] = await Promise.all([
                    fetch('/api/admin/usuarios'),
                    fetch('/api/admin/tenants')
                ]);

                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setUsers(data.usuarios || []);
                }
                if (tenantsRes.ok) {
                    const data = await tenantsRes.json();
                    setTenants(data.tenants || []);
                }
            } catch (error) {
                console.error("Error loading filters", error);
            }
        };
        fetchFilters();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (levelFilter !== 'ALL') params.append('nivel', levelFilter);
            if (search) params.append('search', search);
            if (originFilter) params.append('origen', originFilter);
            if (userFilter) params.append('userEmail', userFilter);
            if (tenantFilter) params.append('tenantId', tenantFilter);
            params.append('limit', '100'); // Límite inicial de pantalla

            const res = await fetch(`/api/admin/logs?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setStats(data.meta || { errorCount: 0, warnCount: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 5000);
        }
        return () => clearInterval(interval);
    }, [levelFilter, search, originFilter, userFilter, tenantFilter, autoRefresh]);

    const handleExport = async (format: 'json' | 'csv') => {
        // En entornos enterprise, la exportación suele ser una descarga
        // de la query actual pero sin límite de paginación para auditoría.
        const params = new URLSearchParams();
        if (levelFilter !== 'ALL') params.append('nivel', levelFilter);
        if (search) params.append('search', search); // Respetar filtros de usuario
        params.append('format', format);
        params.append('limit', '1000'); // Hard limit para exportación directa

        window.open(`/api/admin/logs/export?${params.toString()}`, '_blank');
    };

    const getLevelBadge = (level: string) => {
        switch (level) {
            case 'ERROR': return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20 gap-1"><AlertCircle size={10} /> ERROR</Badge>;
            case 'WARN': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 gap-1"><AlertTriangle size={10} /> WARN</Badge>;
            case 'INFO': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 gap-1"><Info size={10} /> INFO</Badge>;
            default: return <Badge variant="outline" className="text-slate-500"><Activity size={10} className="mr-1" /> DEBUG</Badge>;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            {/* Header / Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl">
                        <Server className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Eventos</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{logs.length}<span className="text-xs font-normal text-slate-400 ml-1">recientes</span></h3>
                    </div>
                </div>
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                        <Bug className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Errores Críticos</p>
                        <h3 className="text-xl font-black text-rose-700 dark:text-rose-400">{stats.errorCount}</h3>
                    </div>
                </div>
                {/* ... más stats ... */}
                <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleExport('csv')}
                        className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    >
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                    <Button
                        variant={autoRefresh ? "secondary" : "outline"}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={cn("border-slate-200 dark:border-slate-800", autoRefresh && "bg-teal-500/10 text-teal-600 border-teal-500/20")}
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", autoRefresh && "animate-spin")} /> {autoRefresh ? 'Live' : 'Refrescar'}
                    </Button>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        placeholder="Buscar en logs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border-none rounded-lg text-xs py-2.5 pl-9 focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                </div>
                {/* User Filter Dropdown */}
                <div className="relative w-48">
                    <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-2.5 px-3 focus:ring-1 focus:ring-teal-500 outline-none appearance-none cursor-pointer"
                    >
                        <option value="">Todos los Usuarios</option>
                        {users.map((u) => (
                            <option key={u._id} value={u.email}>
                                {u.email}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tenant Filter Dropdown */}
                <div className="relative w-48">
                    <select
                        value={tenantFilter}
                        onChange={(e) => setTenantFilter(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-2.5 px-3 focus:ring-1 focus:ring-teal-500 outline-none appearance-none cursor-pointer"
                    >
                        <option value="">Todos los Tenants</option>
                        {tenants.map((t) => (
                            <option key={t.tenantId} value={t.tenantId}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                <div className="flex gap-1">
                    {['ALL', 'ERROR', 'WARN', 'INFO'].map((l) => (
                        <button
                            key={l}
                            onClick={() => setLevelFilter(l as any)}
                            className={cn(
                                "text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all",
                                levelFilter === l
                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logs Table / Stream */}
            <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col relative shadow-xl">
                {/* Visual Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="col-span-2">Timestamp</div>
                    <div className="col-span-1">Nivel</div>
                    <div className="col-span-2">Origen / Acción</div>
                    <div className="col-span-5">Mensaje</div>
                    <div className="col-span-2 text-right">Contexto</div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading && logs.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">Cargando trazas...</div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 opacity-50">
                            <Filter size={32} />
                            <p className="text-xs font-medium">No se encontraron logs con estos filtros</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div
                                key={log._id}
                                onClick={() => setSelectedLog(log)}
                                className={cn(
                                    "grid grid-cols-12 gap-4 p-3 border-b border-slate-50 dark:border-slate-900 items-start cursor-pointer transition-colors text-xs font-mono",
                                    selectedLog?._id === log._id ? "bg-teal-50 dark:bg-teal-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-900/50",
                                    log.nivel === 'ERROR' && "bg-rose-50/50 dark:bg-rose-950/10"
                                )}
                            >
                                <div className="col-span-2 text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                    <span className="text-[10px] opacity-50 ml-1">{new Date(log.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div className="col-span-1">{getLevelBadge(log.nivel)}</div>
                                <div className="col-span-2 flex flex-col">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate" title={log.origen}>{log.origen}</span>
                                    <span className="text-[10px] text-slate-400 truncate">{log.accion}</span>
                                </div>
                                <div className="col-span-5 text-slate-600 dark:text-slate-400 break-words leading-relaxed font-sans">
                                    {log.mensaje}
                                </div>
                                <div className="col-span-2 text-right">
                                    <Badge variant="outline" className="text-[9px] h-5 border-slate-200 dark:border-slate-800 text-slate-400 font-mono">
                                        {(log.tenantId || 'SYSTEM').substring(0, 12)}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Log Detail Overlay Pane */}
                <AnimatePresence>
                    {selectedLog && (
                        <motion.div
                            initial={{ y: 300, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 300, opacity: 0 }}
                            className="absolute bottom-0 left-0 right-0 h-[45%] bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-20"
                        >
                            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6">
                                <div className="flex items-center gap-3">
                                    {getLevelBadge(selectedLog.nivel)}
                                    <span className="text-xs font-mono text-slate-400">{selectedLog.correlacion_id}</span>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                    <span className="sr-only">Cerrar</span>
                                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-6 space-y-4 font-mono text-xs">
                                <section>
                                    <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-1">Mensaje Completo</h4>
                                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{selectedLog.mensaje}</p>
                                </section>

                                {selectedLog.stack && (
                                    <section className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                        <h4 className="text-[10px] uppercase font-bold text-rose-400 mb-2 flex items-center gap-2">
                                            <Bug size={12} /> Stack Trace
                                        </h4>
                                        <pre className="text-rose-700 dark:text-rose-300 overflow-x-auto whitespace-pre">{selectedLog.stack}</pre>
                                    </section>
                                )}

                                {selectedLog.detalles && (
                                    <section>
                                        <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Detalles Técnicos (JSON)</h4>
                                        <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <pre className="text-slate-600 dark:text-slate-400 overflow-x-auto">
                                                {JSON.stringify(selectedLog.detalles, null, 2)}
                                            </pre>
                                        </div>
                                    </section>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
