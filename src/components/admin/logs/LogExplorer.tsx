"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search, RefreshCw,
    AlertCircle, AlertTriangle, Info,
    ChevronLeft, ChevronRight, Eye,
    Clock, Terminal, Database, Shield,
    Loader2
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
import { useTranslations } from "next-intl";

interface LogEntry {
    _id: string;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    source: string;
    action: string;
    message: string;
    correlationId: string;
    tenantId?: string;
    details?: any;
    stack?: string;
    timestamp: string;
}

export function LogExplorer() {
    const t = useTranslations('admin.logs.explorer');
    const tDetail = useTranslations('admin.logs.detail');
    const tLevels = useTranslations('admin.logs.explorer.levels');
    
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [level, setLevel] = useState<string>("");
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                ...(search && { search }),
                ...(level && { level })
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
    }, [page, search, level]);

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

    const getLevelBadge = (logLevel: string) => {
        switch (logLevel) {
            case 'ERROR': return <Badge variant="destructive" className="gap-1"><AlertCircle size={12} aria-hidden="true" /> {tLevels('ERROR')}</Badge>;
            case 'WARN': return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 gap-1"><AlertTriangle size={12} aria-hidden="true" /> {tLevels('WARN')}</Badge>;
            case 'DEBUG': return <Badge variant="secondary" className="gap-1 font-mono"><Terminal size={12} aria-hidden="true" /> {tLevels('DEBUG')}</Badge>;
            default: return <Badge variant="outline" className="text-slate-500 gap-1"><Info size={12} aria-hidden="true" /> {tLevels('INFO')}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={autoRefresh ? "bg-teal-50 border-teal-200 text-teal-700" : ""}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} aria-hidden="true" />
                        {autoRefresh ? t('autoRefreshOn') : t('autoRefreshOff')}
                    </Button>
                    <Button size="sm" onClick={() => fetchLogs()} disabled={loading}>
                        {t('refresh')}
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="bg-slate-50/50">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">{t('searchLabel')}</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                                <Input
                                    placeholder={t('searchPlaceholder')}
                                    className="pl-10 h-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-48 space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">{t('levelLabel')}</label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                            >
                                <option value="">{t('levelAll')}</option>
                                <option value="ERROR">{tLevels('ERROR')}</option>
                                <option value="WARN">{tLevels('WARN')}</option>
                                <option value="INFO">{tLevels('INFO')}</option>
                                <option value="DEBUG">{tLevels('DEBUG')}</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 border-b">{t('table.time')}</th>
                                    <th className="px-6 py-3 border-b">{t('table.level')}</th>
                                    <th className="px-6 py-3 border-b">{t('table.sourceAction')}</th>
                                    <th className="px-6 py-3 border-b">{t('table.message')}</th>
                                    <th className="px-6 py-3 border-b text-right">{t('table.action')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" aria-hidden="true" />
                                            {t('loading')}
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            {t('noResults')}
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
                                                {getLevelBadge(log.level)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-teal-600 uppercase tracking-tight">{log.source}</span>
                                                    <span className="text-[11px] text-slate-500 font-mono">{log.action}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-md">
                                                <p className="truncate text-slate-700 font-medium" title={log.message}>
                                                    {log.message}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                                    ID: {log.correlationId}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    <Eye size={16} className="text-slate-500" aria-hidden="true" />
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
                            {t('showing', { count: logs.length })}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                <ChevronLeft size={16} aria-hidden="true" />
                            </Button>
                            <span className="text-xs font-bold px-3 py-1 bg-white border rounded shadow-sm">
                                {t('page', { current: page, total: totalPages || 1 })}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                <ChevronRight size={16} aria-hidden="true" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {tDetail('title')}
                            {selectedLog && getLevelBadge(selectedLog.level)}
                        </DialogTitle>
                        <DialogDescription>
                            {tDetail('subtitle')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                        <Clock size={10} aria-hidden="true" /> {tDetail('timestamp')}
                                    </p>
                                    <p className="text-sm font-medium">
                                        {format(new Date(selectedLog.timestamp), "dd/MM/yyyy HH:mm:ss.ms")}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                        <Database size={10} aria-hidden="true" /> {tDetail('correlationId')}
                                    </p>
                                    <p className="text-sm font-mono break-all text-teal-600">
                                        {selectedLog.correlationId}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">{tDetail('source')}</p>
                                    <p className="text-sm font-bold">{selectedLog.source}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">{tDetail('action')}</p>
                                    <p className="text-sm font-mono">{selectedLog.action}</p>
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <p className="text-[10px] font-bold uppercase text-slate-400">{tDetail('fullMessage')}</p>
                                <div className="p-3 bg-slate-900 rounded-lg">
                                    <p className="text-slate-100 text-sm font-mono leading-relaxed">
                                        {selectedLog.message}
                                    </p>
                                </div>
                            </div>

                            {selectedLog.details && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">{tDetail('additionalDetails')}</p>
                                    <pre className="p-3 bg-slate-100 rounded-lg text-[11px] overflow-auto max-h-48 font-mono">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.stack && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                        <Shield size={10} aria-hidden="true" /> {tDetail('stackTrace')}
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
