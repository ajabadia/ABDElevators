import React, { useState, useEffect } from 'react';
import {
    Activity,
    ChevronDown,
    ChevronUp,
    X,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';

interface ExecutionLog {
    _id: string;
    nodeId: string;
    type: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    durationMs: number;
    timestamp: string | Date;
    error?: string;
    metadata?: Record<string, any>;
}

interface ExecutionLogsPanelProps {
    workflowId: string;
    onClose: () => void;
}

export const ExecutionLogsPanel = ({ workflowId, onClose }: ExecutionLogsPanelProps) => {
    const t = useTranslations('admin.workflows.logs');
    const locale = useLocale();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [logs, setLogs] = useState<ExecutionLog[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        if (!workflowId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/workflows/analytics/${workflowId}/logs`);
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, [workflowId]);

    return (
        <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-[60] transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-80'}`}>
            <div className="flex items-center justify-between px-4 h-10 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">{t('title')}</h3>
                    <div className="flex items-center gap-1 ml-4 py-0.5 px-2 bg-slate-200 rounded-full">
                        <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-blue-400 animate-pulse' : 'bg-slate-400'}`} />
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{t('live')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchLogs}
                        className="h-7 w-7 p-0 hover:bg-slate-200"
                        disabled={loading}
                    >
                        <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="h-7 w-7 p-0 hover:bg-slate-200"
                    >
                        {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-7 w-7 p-0 hover:bg-red-50 text-slate-400 hover:text-red-500"
                    >
                        <X size={14} />
                    </Button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="flex h-72">
                    {/* Main Log Table */}
                    <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-0 border-r border-slate-100">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                        <tr className="border-b border-slate-100">
                                            <th className="px-4 py-2 text-[10px] uppercase font-bold text-slate-400">{t('table.status')}</th>
                                            <th className="px-4 py-2 text-[10px] uppercase font-bold text-slate-400">{t('table.node')}</th>
                                            <th className="px-4 py-2 text-[10px] uppercase font-bold text-slate-400">{t('table.duration')}</th>
                                            <th className="px-4 py-2 text-[10px] uppercase font-bold text-slate-400">{t('table.time')}</th>
                                            <th className="px-4 py-2 text-[10px] uppercase font-bold text-slate-400">{t('table.details')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {logs.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={5} className="py-10 text-center text-xs text-slate-400 italic">
                                                    {t('no_logs')}
                                                </td>
                                            </tr>
                                        )}
                                        {logs.map((log) => (
                                            <tr key={log._id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-4 py-2">
                                                    {log.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                    {log.status === 'FAILED' && <XCircle className="w-4 h-4 text-red-500" />}
                                                    {log.status === 'SKIPPED' && <Clock className="w-4 h-4 text-amber-500" />}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{log.nodeId}</span>
                                                        <span className="text-[10px] uppercase text-slate-400">{log.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="text-xs font-mono text-slate-500">{log.durationMs}ms</span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="text-xs text-slate-500">
                                                        {formatDistanceToNow(new Date(log.timestamp), {
                                                            addSuffix: true,
                                                            locale: locale === 'es' ? es : enUS
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {log.error ? (
                                                        <span className="text-[10px] text-red-500 font-medium truncate max-w-[200px] block" title={log.error}>
                                                            {log.error}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 italic">{t('no_details')}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Quick Stats Sidebar */}
                    <div className="w-64 bg-slate-50 p-4 space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('summary.quick_stats')}</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-white rounded border border-slate-200">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">{t('summary.total')}</span>
                                <span className="text-lg font-bold text-slate-700">{logs.length}</span>
                            </div>
                            <div className="p-2 bg-white rounded border border-slate-200">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">{t('summary.success')}</span>
                                <span className="text-lg font-bold text-emerald-600">
                                    {logs.filter(l => l.status === 'SUCCESS').length}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">{t('summary.last_error')}</span>
                            {logs.find(l => l.status === 'FAILED') ? (
                                <div className="p-2 bg-red-50 rounded border border-red-100">
                                    <p className="text-[10px] text-red-700 font-medium line-clamp-2">
                                        {logs.find(l => l.status === 'FAILED')?.error}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-[10px] text-slate-400 italic">{t('summary.no_error')}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
