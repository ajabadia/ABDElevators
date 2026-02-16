"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search, Clock, Activity, AlertCircle, Info, CheckCircle,
    ChevronRight, ChevronDown, Terminal, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useTranslations } from 'next-intl';

interface TraceLog {
    _id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
    source: string;
    action: string;
    metrics?: any;
    details?: any;
    traceId?: string;
}

interface TraceViewerProps {
    logs: TraceLog[];
    correlationId: string;
    loading?: boolean;
}

export function TraceViewer({ logs, correlationId, loading }: TraceViewerProps) {
    const t = useTranslations('observability.trace');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [filterLevel, setFilterLevel] = useState<string | null>(null);

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.source.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLevel = filterLevel ? log.level === filterLevel : true;

        return matchesSearch && matchesLevel;
    });

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'ERROR': return <AlertCircle className="w-4 h-4 text-rose-500" />;
            case 'WARN': return <AlertCircle className="w-4 h-4 text-amber-500" />;
            case 'INFO': return <Info className="w-4 h-4 text-blue-500" />;
            default: return <Activity className="w-4 h-4 text-slate-500" />;
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'ERROR': return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900";
            case 'WARN': return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900";
            case 'INFO': return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900";
            default: return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
        }
    };

    const startTime = logs.length > 0 ? new Date(logs[0].timestamp).getTime() : 0;
    const endTime = logs.length > 0 ? new Date(logs[logs.length - 1].timestamp).getTime() : 0;
    const duration = endTime - startTime;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 animate-pulse">
                <Activity className="w-12 h-12 mb-4 opacity-50" />
                <p>{t('loading')}</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">{t('no_logs_title')}</h3>
                <p className="text-sm mt-1">{t('no_logs_desc')} <span className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{correlationId}</span></p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-50 dark:bg-slate-900/50">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">{t('events')}</span>
                        <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">{logs.length}</span>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 dark:bg-slate-900/50">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">{t('duration')}</span>
                        <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">{duration}ms</span>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 dark:bg-slate-900/50">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">{t('start_time')}</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {format(new Date(startTime), "HH:mm:ss.SSS")}
                        </span>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 dark:bg-slate-900/50 md:col-span-1">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">{t('end_state')}</span>
                        <Badge variant={logs.some(l => l.level === 'ERROR') ? "destructive" : "default"} className="mt-1">
                            {logs.some(l => l.level === 'ERROR') ? t('status_error') : t('status_success')}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filterLevel === null ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setFilterLevel(null)}
                    >
                        {t('filter_all')}
                    </Button>
                    <Button
                        variant={filterLevel === 'ERROR' ? "destructive" : "ghost"}
                        size="sm"
                        onClick={() => setFilterLevel('ERROR')}
                        className={filterLevel === 'ERROR' ? "" : "text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"}
                    >
                        {t('filter_errors')}
                    </Button>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative space-y-0 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent dark:before:via-slate-700">
                {filteredLogs.map((log, index) => {
                    const timeOffset = new Date(log.timestamp).getTime() - startTime;
                    const isExpanded = expandedLog === log._id;

                    return (
                        <div key={log._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                            {/* Icon Indicator */}
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${log.level === 'ERROR' ? 'bg-rose-500 text-white' :
                                log.level === 'WARN' ? 'bg-amber-500 text-white' :
                                    'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                }`}>
                                {getLevelIcon(log.level)}
                            </div>

                            {/* Card Content */}
                            <Card className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] mb-8 transition-all duration-200 hover:shadow-md ${isExpanded ? 'ring-2 ring-indigo-500/20' : ''
                                } ${log.level === 'ERROR' ? 'border-l-4 border-l-rose-500' : ''}`}>
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className={`${getLevelColor(log.level)} border font-mono text-[10px]`}>
                                                {log.level}
                                            </Badge>
                                            <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                +{timeOffset}ms
                                            </Badge>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {log.source}
                                            </span>
                                        </div>
                                        <time className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                                            {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                                        </time>
                                    </div>
                                    <CardTitle className="text-sm font-semibold mt-1">
                                        {log.action}
                                    </CardTitle>
                                    <CardDescription className="text-xs line-clamp-2">
                                        {log.message}
                                    </CardDescription>
                                </CardHeader>

                                {log.details && (
                                    <CardContent className="p-4 pt-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-between text-xs h-8 text-slate-400 hover:text-indigo-500"
                                            onClick={() => setExpandedLog(isExpanded ? null : log._id)}
                                        >
                                            <span>{isExpanded ? t('hide_details') : t('show_details')}</span>
                                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        </Button>

                                        {isExpanded && (
                                            <div className="mt-2 bg-slate-950 rounded-lg p-3 text-[10px] font-mono text-emerald-400 overflow-x-auto border border-slate-800 shadow-inner animate-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2 mb-2 text-slate-500 border-b border-slate-800 pb-1">
                                                    <Terminal className="w-3 h-3" />
                                                    <span>{t('payload_inspector')}</span>
                                                </div>
                                                <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        </div>
                    );
                })}
            </div>

            <div className="text-center text-xs text-slate-400 italic">
                {t('end_of_trace')} • {correlationId}
            </div>
        </div>
    );
}
