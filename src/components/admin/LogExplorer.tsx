"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, AlertTriangle, AlertCircle, Info, CheckCircle,
    Download, RefreshCw, Filter, Calendar, Server, Activity, Bug, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiList } from '@/hooks/useApiList';
import { useFilterState } from '@/hooks/useFilterState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslations } from 'next-intl';

// Definición de tipos para los logs
interface LogEntry {
    _id: string;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    source: string;
    action: string;
    message: string;
    correlationId?: string;
    tenantId?: string;
    timestamp: string;
    details?: any;
    stack?: string;
}

interface AuditEntry {
    _id: string;
    tenantId: string;
    action?: string;
    previousState?: any;
    newState: any;
    performedBy: string;
    correlationId?: string;
    timestamp: string;
    ip?: string;
    userAgent?: string;
    promptName?: string;
}

interface User { _id: string; email: string; name: string; }
interface Tenant { tenantId: string; name: string; }

/**
 * Función de utilidad para encontrar diferencias entre dos objetos
 */
function getObjectDiff(prev: any, next: any): Record<string, { prev: any, next: any }> {
    const diff: Record<string, { prev: any, next: any }> = {};
    if (!prev || !next) return diff;

    const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    for (const key of allKeys) {
        if (key === '_id' || key === 'updatedAt' || key === 'timestamp') continue;

        const p = prev[key];
        const n = next[key];

        if (JSON.stringify(p) !== JSON.stringify(n)) {
            diff[key] = { prev: p, next: n };
        }
    }
    return diff;
}

export default function LogExplorer() {
    const t = useTranslations('admin.logs');
    // 1. Filtros y Estados UI
    const [viewMode, setViewMode] = useState<'LOGS' | 'AUDIT'>('LOGS');
    const { filters, setFilter, clearFilters, activeFilters } = useFilterState({
        initialFilters: {
            search: '',
            level: 'ALL' as 'ALL' | 'ERROR' | 'WARN' | 'INFO',
            source: '',
            userEmail: '',
            tenantId: '',
            limit: '100'
        }
    });

    const [autoRefresh, setAutoRefresh] = useLocalStorage('logexplorer_autorefresh', false);

    // Selección para detalle
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [selectedAudit, setSelectedAudit] = useState<AuditEntry | null>(null);

    // 2. Gestión de datos con hooks genéricos
    const { data: users } = useApiList<User>({ endpoint: '/api/admin/usuarios', dataKey: 'usuarios' });
    const { data: tenants } = useApiList<Tenant>({ endpoint: '/api/admin/tenants', dataKey: 'tenants' });

    // 3. Listas principales (Logs o Auditoría)
    const {
        data: logs,
        isLoading: loadingLogs,
        refresh: refreshLogs
    } = useApiList<LogEntry>({
        endpoint: '/api/admin/logs',
        dataKey: 'logs',
        autoFetch: viewMode === 'LOGS',
        filters: {
            ...activeFilters,
            level: filters.level !== 'ALL' ? filters.level : undefined,
        }
    });

    // Auditoría es más compleja porque une varios endpoints en el original.
    // Mantenemos el fetch manual para la unión o creamos un endpoint de auditoría unificado si no existe.
    // Por ahora usamos useApiList para el modo auditoría asumiendo un proxy o manteniéndolo simplificado.
    const {
        data: auditData,
        isLoading: loadingAudit,
        refresh: refreshAudit
    } = useApiList<AuditEntry>({
        endpoint: '/api/admin/audit/combined', // Asumimos que crearemos este endpoint o usamos uno base
        autoFetch: viewMode === 'AUDIT',
        filters: activeFilters
    });

    // Efecto para Auto-Refresh
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(viewMode === 'LOGS' ? refreshLogs : refreshAudit, 5000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, viewMode, refreshLogs, refreshAudit]);

    const handleExport = async (format: 'json' | 'csv') => {
        const params = new URLSearchParams();
        if (filters.level !== 'ALL') params.append('level', filters.level);
        if (filters.search) params.append('search', filters.search);
        params.append('format', format);
        params.append('limit', '1000');
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

    const getAuditActionDetails = (action?: string) => {
        if (!action) return { color: 'bg-slate-500', icon: <Activity size={10} />, label: t('badges.unknown') };
        if (action.includes('PROMPT')) return { color: 'bg-indigo-500', icon: <Bug size={10} />, label: t('badges.prompt') };
        if (action.includes('BILLING')) return { color: 'bg-emerald-500', icon: <CheckCircle size={10} />, label: t('badges.billing') };
        if (action.includes('STORAGE')) return { color: 'bg-sky-500', icon: <Server size={10} />, label: t('badges.storage') };
        if (action.includes('INGEST')) return { color: 'bg-cyan-500', icon: <FileText size={10} />, label: t('badges.ingest') };
        return { color: 'bg-slate-500', icon: <Activity size={10} />, label: t('badges.config') };
    };

    const isLoading = viewMode === 'LOGS' ? loadingLogs : loadingAudit;
    const currentData = viewMode === 'LOGS' ? logs : auditData;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            {/* Header / Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl">
                        <Server className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('stats.total')}</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">
                            {currentData?.length || 0}
                            <span className="text-xs font-normal text-slate-400 ml-1">{t('stats.recent')}</span>
                        </h3>
                    </div>
                </div>
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                        <Bug className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">{t('stats.errors')}</p>
                        <h3 className="text-xl font-black text-rose-700 dark:text-rose-400">
                            {viewMode === 'LOGS' ? logs?.filter(l => l.level === 'ERROR').length : '0'}
                        </h3>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2">
                    <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex mr-4 shadow-inner">
                        <button
                            onClick={() => setViewMode('LOGS')}
                            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'LOGS' ? "bg-white dark:bg-slate-800 text-teal-600 shadow-sm" : "text-slate-500 opacity-60 hover:opacity-100")}
                        >
                            {t('tabs.system')}
                        </button>
                        <button
                            onClick={() => setViewMode('AUDIT')}
                            className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", viewMode === 'AUDIT' ? "bg-white dark:bg-slate-800 text-teal-600 shadow-sm" : "text-slate-500 opacity-60 hover:opacity-100")}
                        >
                            {t('tabs.audit')}
                        </button>
                    </div>
                    <Button variant="outline" onClick={() => handleExport('csv')} className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        <Download className="w-4 h-4 mr-2" /> {t('actions.export')}
                    </Button>
                    <Button
                        variant={autoRefresh ? "secondary" : "outline"}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={cn("border-slate-200 dark:border-slate-800", autoRefresh && "bg-teal-500/10 text-teal-600 border-teal-500/20 shadow-inner")}
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", autoRefresh && "animate-spin")} /> {autoRefresh ? t('actions.live') : t('actions.refresh')}
                    </Button>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        placeholder={viewMode === 'LOGS' ? t('filters.search_logs') : t('filters.search_audit')}
                        value={filters.search}
                        onChange={(e) => setFilter('search', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border-none rounded-lg text-xs py-2.5 pl-9 focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                </div>
                <select
                    value={filters.userEmail}
                    onChange={(e) => setFilter('userEmail', e.target.value)}
                    className="w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-2.5 px-3 focus:ring-1 focus:ring-teal-500 outline-none appearance-none cursor-pointer"
                >
                    <option value="">{t('filters.all_users')}</option>
                    {users?.map((u) => <option key={u._id} value={u.email}>{u.email}</option>)}
                </select>

                <select
                    value={filters.tenantId}
                    onChange={(e) => setFilter('tenantId', e.target.value)}
                    className="w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs py-2.5 px-3 focus:ring-1 focus:ring-teal-500 outline-none appearance-none cursor-pointer"
                >
                    <option value="">{t('filters.all_tenants')}</option>
                    {tenants?.map((t) => <option key={t.tenantId} value={t.tenantId}>{t.name}</option>)}
                </select>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                <div className="flex gap-1">
                    {['ALL', 'ERROR', 'WARN', 'INFO'].map((l) => (
                        <button
                            key={l}
                            onClick={() => setFilter('level', l as any)}
                            disabled={viewMode === 'AUDIT'}
                            className={cn(
                                "text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all",
                                filters.level === l ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                                viewMode === 'AUDIT' && "opacity-30 cursor-not-allowed"
                            )}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col relative shadow-xl">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="col-span-2">{t('table.timestamp')}</div>
                    {viewMode === 'LOGS' ? (
                        <>
                            <div className="col-span-1">{t('table.level')}</div>
                            <div className="col-span-2">{t('table.source')}</div>
                            <div className="col-span-5">{t('table.message')}</div>
                        </>
                    ) : (
                        <>
                            <div className="col-span-2">{t('table.source')}</div>
                            <div className="col-span-3">{t('table.entity')}</div>
                            <div className="col-span-3">{t('table.trace')}</div>
                        </>
                    )}
                    <div className="col-span-2 text-right">{t('table.context')}</div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading && (!currentData || currentData.length === 0) ? (
                        <div className="p-8 text-center text-slate-400 text-xs">{t('status.loading')}</div>
                    ) : !currentData || currentData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 opacity-50">
                            <Activity size={32} />
                            <p className="text-xs font-medium">{t('status.no_results')}</p>
                        </div>
                    ) : viewMode === 'LOGS' ? (
                        (currentData as LogEntry[]).map((log) => (
                            <div
                                key={log._id}
                                onClick={() => setSelectedLog(log)}
                                className={cn(
                                    "grid grid-cols-12 gap-4 p-3 border-b border-slate-50 dark:border-slate-900 items-start cursor-pointer transition-colors text-xs font-mono",
                                    selectedLog?._id === log._id ? "bg-teal-50 dark:bg-teal-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-900/50",
                                    log.level === 'ERROR' && "bg-rose-50/50 dark:bg-rose-950/10"
                                )}
                            >
                                <div className="col-span-2 text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                    <span className="text-[10px] opacity-50 ml-1">{new Date(log.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div className="col-span-1">{getLevelBadge(log.level)}</div>
                                <div className="col-span-2 flex flex-col">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate" title={log.source}>{log.source}</span>
                                    <span className="text-[10px] text-slate-400 truncate">{log.action}</span>
                                </div>
                                <div className="col-span-5 text-slate-600 dark:text-slate-400 break-words leading-relaxed font-sans">
                                    {log.message}
                                </div>
                                <div className="col-span-2 text-right">
                                    <Badge variant="outline" className="text-[9px] h-5 border-slate-200 dark:border-slate-800 text-slate-400 font-mono">
                                        {(log.tenantId || 'SYSTEM').substring(0, 12)}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    ) : (
                        (currentData as AuditEntry[]).map((audit) => {
                            const details = getAuditActionDetails(audit.action);
                            return (
                                <div
                                    key={audit._id}
                                    onClick={() => setSelectedAudit(audit)}
                                    className={cn(
                                        "grid grid-cols-12 gap-4 p-4 border-b border-slate-50 dark:border-slate-900 items-start cursor-pointer transition-all text-xs group",
                                        selectedAudit?._id === audit._id ? "bg-teal-50/50 dark:bg-teal-900/10 border-l-2 border-l-teal-500" : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                    )}
                                >
                                    <div className="col-span-2 font-mono text-slate-500 flex flex-col">
                                        <span className="text-slate-900 dark:text-slate-100 font-bold">{new Date(audit.timestamp).toLocaleTimeString()}</span>
                                        <span className="text-[10px] opacity-50">{new Date(audit.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <Badge className={cn("h-5 text-[9px] gap-1 px-2 border-transparent", details.color)}>
                                            {details.icon} {details.label}
                                        </Badge>
                                        <div className="mt-1 text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate">{audit.action}</div>
                                    </div>
                                    <div className="col-span-3 flex flex-col">
                                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{audit.promptName || `ID: ${audit.tenantId}`}</span>
                                        <span className="text-[10px] text-teal-600 font-medium truncate italic">{audit.performedBy || 'Sistema'}</span>
                                    </div>
                                    <div className="col-span-3 text-slate-400 text-[10px] flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1"><Server size={8} /> IP: <span className="font-mono">{audit.ip || '0.0.0.0'}</span></div>
                                        <div className="flex items-center gap-1 text-[8px]"><Activity size={8} /> CORR: <span className="font-mono text-slate-300">{audit.correlationId?.substring(0, 13) || 'N/A'}</span></div>
                                    </div>
                                    <div className="col-span-2 text-right self-center">
                                        <Button variant="ghost" size="sm" className="h-7 text-[9px] uppercase font-black tracking-widest text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {t('detail.analyze_diff')}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>

            {/* Standard Log Detail Overlay */}
            <AnimatePresence>
                {selectedLog && (
                    <motion.div
                        initial={{ y: 300, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 300, opacity: 0 }}
                        className="absolute bottom-0 left-0 right-0 h-[45%] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-20"
                    >
                        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-6">
                            <div className="flex items-center gap-3">
                                {getLevelBadge(selectedLog.level)}
                                <span className="text-xs font-mono text-slate-400">{selectedLog.correlationId || 'no-trace-id'}</span>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors group">
                                <span className="sr-only">{t('detail.close')}</span>
                                <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6 space-y-4 font-mono text-xs">
                            <section>
                                <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-1 border-b pb-1 flex items-center gap-2"><Activity size={10} /> {t('detail.message')}</h4>
                                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed py-2 font-sans text-sm">{selectedLog.message}</p>
                            </section>

                            {selectedLog.stack && (
                                <section className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                    <h4 className="text-[10px] uppercase font-bold text-rose-400 mb-2 flex items-center gap-2">
                                        <Bug size={12} /> {t('detail.stack')}
                                    </h4>
                                    <pre className="text-rose-700 dark:text-rose-300 overflow-x-auto whitespace-pre leading-tight">{selectedLog.stack}</pre>
                                </section>
                            )}

                            {selectedLog.details && (
                                <section>
                                    <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2 border-b pb-1">{t('detail.json')}</h4>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <pre className="text-slate-600 dark:text-slate-400 overflow-x-auto scrollbar-thin">
                                            {JSON.stringify(selectedLog.details, null, 2)}
                                        </pre>
                                    </div>
                                </section>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pro Audit Detail Overlay / Diff Viewer */}
            <AnimatePresence>
                {selectedAudit && (
                    <motion.div
                        initial={{ x: 600, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 600, opacity: 0 }}
                        className="absolute top-0 right-0 bottom-0 w-2/3 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.3)] z-30 flex flex-col"
                    >
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Badge className={cn("text-[9px]", getAuditActionDetails(selectedAudit.action).color)}>AUDIT LOG</Badge>
                                    <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">{t('detail.integrity')}</h3>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedAudit._id}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedAudit(null)} className="rounded-full h-8 w-8 p-0">
                                <span className="text-lg">×</span>
                            </Button>
                        </div>

                        <div className="flex-1 overflow-auto p-8 space-y-8">
                            {/* Extended Metadata Grid */}
                            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                <div className="space-y-1">
                                    <p className="text-[9px] uppercase font-black text-slate-400 flex items-center gap-1"><Calendar size={10} /> Timestamp</p>
                                    <p className="text-xs font-bold leading-none">{new Date(selectedAudit.timestamp).toLocaleTimeString()}</p>
                                    <p className="text-[10px] text-slate-400">{new Date(selectedAudit.timestamp).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1 border-l pl-4 border-slate-200 dark:border-slate-800">
                                    <p className="text-[9px] uppercase font-black text-teal-600 flex items-center gap-1"><Info size={10} /> Responsable</p>
                                    <p className="text-xs font-bold truncate" title={selectedAudit.performedBy}>{selectedAudit.performedBy || 'Sistema'}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Admin Auth</p>
                                </div>
                                <div className="space-y-1 border-l pl-4 border-slate-200 dark:border-slate-800">
                                    <p className="text-[9px] uppercase font-black text-slate-400 flex items-center gap-1"><Server size={10} /> IP Origen</p>
                                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{selectedAudit.ip || '0.0.0.0'}</p>
                                    <p className="text-[9px] text-teal-500 font-bold">SECURE_AGENT</p>
                                </div>
                                <div className="space-y-1 border-l pl-4 border-slate-200 dark:border-slate-800">
                                    <p className="text-[9px] uppercase font-black text-slate-400 flex items-center gap-1"><Activity size={10} /> Correlación</p>
                                    <p className="text-xs font-mono truncate text-slate-500" title={selectedAudit.correlationId}>{selectedAudit.correlationId?.substring(0, 16) || 'N/A'}</p>
                                    <button className="text-[9px] text-blue-500 font-bold hover:underline">Ver Trace</button>
                                </div>
                            </div>

                            {/* Comparison / Diff Section */}
                            <section className="space-y-4">
                                <h4 className="text-[11px] uppercase font-black text-slate-900 dark:text-white border-l-4 border-teal-500 pl-3">{t('detail.diff_title')}</h4>

                                {selectedAudit.previousState ? (
                                    <div className="space-y-2">
                                        {Object.entries(getObjectDiff(selectedAudit.previousState, selectedAudit.newState)).map(([key, value]) => (
                                            <div key={key} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                                                <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 text-[10px] font-black uppercase text-slate-500 flex justify-between border-b">
                                                    <span>{t('detail.property')}: <span className="text-teal-600">{key}</span></span>
                                                    <Badge variant="outline" className="text-[8px] h-4">MODIFIED</Badge>
                                                </div>
                                                <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
                                                    <div className="p-3 bg-rose-50/20 dark:bg-rose-950/5">
                                                        <p className="text-[8px] uppercase font-bold text-rose-400 mb-1">{t('detail.previous')}</p>
                                                        <pre className="text-[10px] text-rose-700 dark:text-rose-400 whitespace-pre-wrap font-mono">
                                                            {typeof value.prev === 'object' ? JSON.stringify(value.prev, null, 1) : String(value.prev)}
                                                        </pre>
                                                    </div>
                                                    <div className="p-3 bg-emerald-50/20 dark:bg-emerald-950/5">
                                                        <p className="text-[8px] uppercase font-bold text-emerald-600 mb-1">{t('detail.next')}</p>
                                                        <pre className="text-[10px] text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap font-mono">
                                                            {typeof value.next === 'object' ? JSON.stringify(value.next, null, 1) : String(value.next)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                                        <div className="p-3 bg-emerald-500/10 w-fit mx-auto rounded-full mb-3 italic">
                                            <CheckCircle className="text-emerald-500" size={24} />
                                        </div>
                                        <h5 className="font-bold text-slate-900 dark:text-white">{t('detail.initial_creation')}</h5>
                                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{t('detail.initial_desc')}</p>
                                    </div>
                                )}
                            </section>

                            {/* Raw Full Snapshot */}
                            <section>
                                <h4 className="text-[11px] uppercase font-black text-slate-400 mb-4 border-b pb-2">{t('detail.snapshot')}</h4>
                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
                                    <div className="absolute top-4 right-4 text-[10px] text-slate-600 font-mono tracking-tighter">BSON_BLOB_STORAGE</div>
                                    <pre className="text-[10px] font-mono leading-relaxed text-blue-400 max-h-[300px] overflow-auto scrollbar-thin scrollbar-thumb-blue-900/50">
                                        {JSON.stringify(selectedAudit.newState, null, 2)}
                                    </pre>
                                </div>
                            </section>

                            {selectedAudit.userAgent && (
                                <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex items-start gap-3">
                                    <Info className="text-amber-500 mt-0.5" size={14} />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-amber-600/70">User Agent Context</p>
                                        <p className="text-[9px] text-slate-500 leading-tight italic font-sans">{selectedAudit.userAgent}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
