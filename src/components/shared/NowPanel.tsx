"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Activity, Database, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApiItem } from "@/hooks/useApiItem";

export function NowPanel({
    open,
    onOpenChange
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const router = useRouter();
    const { data, isLoading } = useApiItem<any>({
        endpoint: "/api/admin/dashboard/now",
        autoFetch: open,
    });

    const ingest = data?.ingest ?? {};
    const rag = data?.rag ?? {};
    const autopilot = data?.autopilot ?? {};

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:w-[400px] border-l border-border dark:border-slate-800 p-0">
                <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50">
                    <SheetHeader className="p-6 border-b bg-card">
                        <SheetTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-teal-500" />
                            Ahora mismo
                        </SheetTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Resumen en tiempo casi real de lo que está haciendo la plataforma.
                        </p>
                    </SheetHeader>

                    <div className="p-6 flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Ingesta */}
                                <button
                                    onClick={() => { router.push("/admin/operations"); onOpenChange(false); }}
                                    className="w-full text-left p-4 rounded-2xl border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex items-start gap-4 group"
                                >
                                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        <Database className="w-5 h-5" />
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase text-emerald-600/70 dark:text-emerald-400/70 tracking-widest mb-1">
                                            Ingesta Activa
                                        </p>
                                        <p className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                                            {ingest.processing ?? 0} en proceso
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {ingest.failedToday ?? 0} con error hoy
                                        </p>
                                        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <span className="text-muted-foreground">Éxito 24h</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                                {(ingest.successRate ?? 0).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </button>

                                {/* RAG / Consultas */}
                                <button
                                    onClick={() => { router.push("/admin/operations/observability"); onOpenChange(false); }}
                                    className="w-full text-left p-4 rounded-2xl border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex items-start gap-4 group"
                                >
                                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 group-hover:scale-110 transition-transform">
                                        <Zap className="w-5 h-5" />
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase text-sky-600/70 dark:text-sky-400/70 tracking-widest mb-1">
                                            Consultas IA (RAG)
                                        </p>
                                        <p className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                                            Latencia {Math.round(rag.latencyMs ?? 0)} ms
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            Feedback {(rag.negativeFeedbackRate ?? 0).toFixed(1)}% negativo
                                        </p>
                                        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <span className="text-muted-foreground">Tráfico 1h</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                                {rag.requestsLastHour ?? 0} reqs
                                            </span>
                                        </div>
                                    </div>
                                </button>

                                {/* Autopiloto / Alertas */}
                                <button
                                    onClick={() => { router.push("/admin/labs"); onOpenChange(false); }}
                                    className="w-full text-left p-4 rounded-2xl border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex items-start gap-4 group"
                                >
                                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="w-5 h-5" />
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase text-amber-600/70 dark:text-amber-400/70 tracking-widest mb-1">
                                            Autopiloto
                                        </p>
                                        <p className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                                            {autopilot.actionsLast24h ?? 0} Playbooks
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                            Últ: {autopilot.lastActionLabel ?? "N/A"}
                                        </p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
