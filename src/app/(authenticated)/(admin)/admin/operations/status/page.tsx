"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Activity, Clock, CheckCircle2, AlertCircle, RefreshCcw,
    Trash2, Server, Play, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QueueStatus {
    type: string;
    recentJobs: any[];
    metrics: {
        active: number;
        failed: number;
        completed: number;
    };
}

export default function StatusPage() {
    const t = useTranslations("admin.jobs");
    const { toast } = useToast();
    const [queues, setQueues] = useState<QueueStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchStatus = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/operations/queues');
            const data = await res.json();
            if (data.success) {
                setQueues(data.queues);
                setLastUpdated(new Date());
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los estados de las colas.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = (state: string) => {
        switch (state) {
            case 'active': return <Play className="w-3 h-3 text-blue-500 animate-pulse" />;
            case 'completed': return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
            case 'failed': return <AlertCircle className="w-3 h-3 text-rose-500" />;
            default: return <Clock className="w-3 h-3 text-slate-400" />;
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                backHref="/admin/operations"
                actions={
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground hidden md:block">
                            Última actualización: {lastUpdated.toLocaleTimeString()}
                        </span>
                        <Button variant="outline" size="sm" onClick={fetchStatus} disabled={isLoading} className="gap-2 rounded-xl">
                            <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                            Refrescar
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {queues.map((queue) => (
                    <Card key={queue.type} className="border-slate-200 shadow-sm overflow-hidden group hover:border-teal-200 transition-colors">
                        <CardHeader className="pb-2 bg-slate-50/50">
                            <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                {queue.type.replace('_', ' ')}
                                <Server className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-3xl font-bold tracking-tighter text-slate-800">{queue.metrics.active}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Activos</p>
                                </div>
                                <div className="h-10 w-[1px] bg-slate-100" />
                                <div className="space-y-1">
                                    <p className="text-3xl font-bold tracking-tighter text-rose-500">{queue.metrics.failed}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Fallidos</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/30 border-t border-slate-100/50 p-3">
                            <div className="flex w-full items-center justify-between">
                                <div className="flex gap-1.5">
                                    <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-100">
                                        {queue.metrics.completed} OK
                                    </Badge>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card className="mt-8 border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800">Historial Reciente de Ejecución</CardTitle>
                            <CardDescription>Auditoría en tiempo real de los últimos procesos agénticos.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold">
                                <tr>
                                    <th className="px-6 py-3 text-left">ID Trabajo</th>
                                    <th className="px-6 py-3 text-left">Tipo</th>
                                    <th className="px-6 py-3 text-left">Estado</th>
                                    <th className="px-6 py-3 text-left">Creado</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {queues.flatMap(q => q.recentJobs).sort((a, b) => b.timestamp - a.timestamp).map((job) => (
                                    <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                            {job.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 text-slate-600 border-none">
                                                {job.data?.type || 'UNKNOWN'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(job.state)}
                                                <span className={cn(
                                                    "text-xs font-bold uppercase tracking-wide",
                                                    job.state === 'active' ? "text-blue-600" :
                                                        job.state === 'completed' ? "text-emerald-600" :
                                                            job.state === 'failed' ? "text-rose-600" :
                                                                "text-slate-500"
                                                )}>
                                                    {job.state}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-400">
                                            {new Date(job.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {job.state === 'failed' && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50">
                                                        <RefreshCcw className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {queues.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-slate-400">
                                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                            <p className="font-bold">No se detectó actividad en las colas</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </PageContainer>
    );
}
