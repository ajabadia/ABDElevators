"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Activity,
    Terminal,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    FileText,
    Cpu
} from "lucide-react";
import { format } from "date-fns";

interface IngestionDiagnosticModalProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string;
    filename: string;
}

export function IngestionDiagnosticModal({ isOpen, onClose, assetId, filename }: IngestionDiagnosticModalProps) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && assetId) {
            fetchData();
        }
    }, [isOpen, assetId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/knowledge-assets/${assetId}/trace`);
            const json = await res.json();
            if (json.success) {
                setData(json);
            }
        } catch (err) {
            console.error("Failed to fetch diagnostics", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-none w-[98vw] h-[85vh] flex flex-col p-0 overflow-hidden border-slate-200">
                <DialogHeader className="p-6 pb-2 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="text-primary w-5 h-5" />
                                Diagnóstico de Ingesta
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-500 font-medium">
                                Tracking de procesamiento para: <span className="text-slate-900 font-bold">{filename}</span>
                            </DialogDescription>
                        </div>
                        {data?.asset?.correlationId && (
                            <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 text-slate-500 border-slate-200">
                                ID: {data.asset.correlationId}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <Activity className="w-8 h-8 text-primary animate-pulse" />
                                <p className="text-sm text-slate-400 font-medium">Cargando trazas técnicas...</p>
                            </div>
                        </div>
                    ) : !data ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            No se pudieron cargar los datos de diagnóstico.
                        </div>
                    ) : (
                        <Tabs defaultValue="audit" className="flex-1 flex flex-col w-full h-full">
                            <div className="px-6 bg-white border-b border-slate-100">
                                <TabsList className="bg-transparent border-b-0 h-12 w-full justify-start gap-6 p-0">
                                    <TabsTrigger
                                        value="audit"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-12 px-2 font-bold transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Search size={16} />
                                            Pipeline Audit
                                        </div>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="logs"
                                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-12 px-2 font-bold transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Terminal size={16} />
                                            Technical Logs
                                        </div>
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <TabsContent value="audit" className="h-full m-0 p-6 focus-visible:ring-0">
                                    <ScrollArea className="h-full pr-4">
                                        <div className="space-y-8 relative before:absolute before:inset-0 before:left-[15px] before:w-[2px] before:bg-slate-200 before:h-full">
                                            {!data.audit || data.audit.length === 0 ? (
                                                <div className="pl-10 text-slate-400 italic py-4">
                                                    No hay eventos de auditoría registrados para esta ingesta.
                                                </div>
                                            ) : data.audit?.map((event: any, idx: number) => (
                                                <div key={idx} className="relative pl-10">
                                                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm
                                                        ${event.status === 'SUCCESS' ? 'bg-emerald-500 text-white' :
                                                            event.status === 'FAILED' ? 'bg-red-500 text-white' :
                                                                event.status === 'PROCESSING' ? 'bg-primary text-white animate-pulse' :
                                                                    'bg-slate-400 text-white'}`}>
                                                        {event.status === 'SUCCESS' ? <CheckCircle2 size={14} /> :
                                                            event.status === 'FAILED' ? <AlertCircle size={14} /> :
                                                                <Clock size={14} />}
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-bold text-slate-900 uppercase tracking-tight text-xs">
                                                                {event.status}
                                                            </h4>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                {format(new Date(event.timestamp), "HH:mm:ss.SSS")}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed">
                                                            {event.details?.source === 'ADMIN_INGEST' ? 'Preparación inicial y de-duplicación finalizada.' :
                                                                event.details?.source === 'ASYNC_WORKER' ? 'Procesamiento completo por el worker.' :
                                                                    'Estado de ingesta actualizado.'}
                                                        </p>
                                                        {event.details && (
                                                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-50">
                                                                {Object.entries(event.details).map(([k, v]: any) => (
                                                                    <div key={k} className="flex flex-col">
                                                                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{k}</span>
                                                                        <span className="text-[11px] text-slate-700 font-mono truncate">{String(v)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="logs" className="h-full m-0 p-0 focus-visible:ring-0">
                                    <div className="flex flex-col h-full bg-[#0a0c10]">
                                        <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stdout Stream</span>
                                                </div>
                                                <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700 text-[9px]">
                                                    {data.logs?.length || 0} Entries
                                                </Badge>
                                            </div>
                                        </div>
                                        <ScrollArea className="flex-1 p-4 font-mono overflow-auto">
                                            <div className="space-y-1">
                                                {!data.logs || data.logs.length === 0 ? (
                                                    <p className="text-slate-600 italic text-xs">No technical logs emitted for this correlationId.</p>
                                                ) : data.logs?.map((log: any, idx: number) => (
                                                    <div key={idx} className="group flex gap-3 text-[11px] leading-relaxed py-0.5 hover:bg-slate-800/30 rounded px-1">
                                                        <span className="text-slate-500 shrink-0 w-20">
                                                            {format(new Date(log.timestamp), "HH:mm:ss")}
                                                        </span>
                                                        <span className={`shrink-0 w-12 font-bold rounded px-1 text-center h-fit
                                                            ${log.level === 'ERROR' ? 'bg-red-900/40 text-red-400' :
                                                                log.level === 'WARN' ? 'bg-amber-900/40 text-amber-400' :
                                                                    'bg-slate-800 text-slate-400'}`}>
                                                            {log.level}
                                                        </span>
                                                        <span className="text-emerald-500/80 shrink-0 font-bold">[{log.source}]</span>
                                                        <span className="text-slate-300 break-words">{log.message}</span>
                                                        {log.details && Object.keys(log.details).length > 0 && (
                                                            <span className="text-slate-500 italic opacity-60 group-hover:opacity-100 transition-opacity">
                                                                {JSON.stringify(log.details)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
