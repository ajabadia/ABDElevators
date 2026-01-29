"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ShieldCheck,
    History,
    Scale,
    AlertOctagon,
    CheckCircle2,
    XCircle,
    Clock,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIDecisionAudit } from '@/types/governance';

export function KnowledgeGovernance() {
    const [logs, setLogs] = useState<AIDecisionAudit[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/core/governance/audit');
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (error) {
            console.error("Error fetching governance audit logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-50 dark:bg-slate-900 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <ShieldCheck className="text-teal-600" size={24} />
                        Gobierno de Conocimiento & IA
                    </h3>
                    <p className="text-slate-500 text-sm">Auditoría y control de políticas sobre decisiones autónomas.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {logs.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                        <History className="mx-auto text-slate-300 mb-4" size={40} />
                        <h4 className="font-bold text-slate-900">Sin actividad reciente</h4>
                        <p className="text-sm text-slate-500">No se han registrado acciones de IA bajo supervisión de gobierno.</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <Card key={log.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white dark:bg-slate-950">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    <div className={cn(
                                        "w-2 shrink-0",
                                        log.status === 'executed' ? 'bg-emerald-500' :
                                            log.status === 'blocked' ? 'bg-red-500' :
                                                log.status === 'pending_review' ? 'bg-amber-500' : 'bg-slate-400'
                                    )} />

                                    <div className="p-5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="text-[10px] font-mono tracking-tighter opacity-50">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </Badge>
                                                <Badge className={cn(
                                                    "uppercase text-[9px] font-black",
                                                    log.status === 'executed' ? 'bg-emerald-50 text-emerald-700' :
                                                        log.status === 'blocked' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                                )}>
                                                    {log.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <h4 className="font-extrabold text-slate-900 dark:text-white capitalize leading-tight">
                                                {log.actionType.replace('_', ' ')}
                                                <span className="text-slate-400 font-medium ml-2">en {log.entitySlug}</span>
                                            </h4>
                                            <div className="text-xs text-slate-500 flex items-center gap-4">
                                                <span className="flex items-center gap-1 font-semibold">
                                                    Confianza: {(log.confidence * 100).toFixed(1)}%
                                                </span>
                                                <span className="text-slate-300">|</span>
                                                <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded font-mono text-[9px]">
                                                    ID: {log.correlacion_id.split('-')[0]}...
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {log.status === 'executed' && <CheckCircle2 className="text-emerald-500" size={20} />}
                                            {log.status === 'blocked' && <XCircle className="text-red-500" size={20} />}
                                            {log.status === 'pending_review' && <Clock className="text-amber-500" size={20} />}
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 italic max-w-[200px] truncate">
                                                {JSON.stringify(log.decision).substring(0, 50)}...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
