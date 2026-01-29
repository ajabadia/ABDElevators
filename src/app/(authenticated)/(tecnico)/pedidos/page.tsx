"use client";

import { useState } from "react";
import { Upload, FileText, Search, Zap, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RagReportView } from "@/components/tecnico/RagReportView";
import { AgentTraceViewer } from "@/components/agente/AgentTraceViewer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Nuevos componentes y hooks genéricos
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { EntityEngine } from "@/core/engine/EntityEngine";
import { useSession } from "next-auth/react";
import { formatDateTime } from "@/lib/date-utils";

import { DynamicFormModal } from "@/components/shared/DynamicFormModal";
import { useFormModal } from "@/hooks/useFormModal";

export default function PedidosPage() {
    const { data: session } = useSession();
    const { toast } = useToast();

    // 0. Obtener definición de la entidad desde el "Cerebro" (KIMI Vision)
    const entity = EntityEngine.getInstance().getEntity('pedido')!;

    const [isUploading, setIsUploading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [currentPedidoId, setCurrentPedidoId] = useState<string | null>(null);
    const [showTrace, setShowTrace] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Hook para el modal de edición dinámica
    const editModal = useFormModal<any>();

    // 1. Gestión de datos con hook genérico para la lista de recientes
    const { data: pedidos, isLoading: isLoadingList, refresh } = useApiList<any>({
        endpoint: entity.api.list,
        dataKey: entity.plural,
        filters: { limit: 5 } // Mostrar últimos 5 por defecto
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const ingestAndStartAnalysis = async () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("ingestOnly", "true");

        try {
            // Usamos el endpoint definido en la ontología
            const resp = await fetch(entity.api.analyze!, {
                method: "POST",
                body: formData,
            });
            const data = await resp.json();

            if (data.success && data.pedido_id) {
                setCurrentPedidoId(data.pedido_id);
                setShowTrace(true);
                toast({
                    title: `${entity.name} procesado`,
                    description: "Iniciando cerebro agéntico para análisis técnico..."
                });
                refresh(); // Refrescar la lista de recientes
            } else {
                toast({
                    title: "Error",
                    description: data.message || `No se pudo procesar el ${entity.name}`,
                    variant: "destructive"
                });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Error fatal", description: "Fallo de conexión", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleAnalysisComplete = async () => {
        if (!currentPedidoId) return;

        try {
            const detailUrl = entity.api.detail!.replace(':id', currentPedidoId);
            const res = await fetch(detailUrl);
            const data = await res.json();

            // Adaptamos la respuesta según si viene del core genérico o del legacy
            const pedido = data.pedido || data.entity;

            if (pedido) {
                setAnalysisResult({
                    pedido_id: pedido.numero_pedido || pedido.id,
                    modelos: pedido.modelos_detectados || pedido.metadata?.modelos || [],
                    riesgos: pedido.metadata?.risks || []
                });
                setShowTrace(false);
                refresh();
            }
        } catch (err) {
            toast({ title: "Error", description: "No se pudieron recuperar los resultados finales", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Análisis <span className="text-teal-600">de {entity.plural}</span>
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Procesamiento agéntico y validación técnica de especificaciones (KIMI Engine).
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                    <Zap size={14} className="text-amber-500" />
                    Powered by Gemini 3 Flash
                </div>
            </div>

            {analysisResult ? (
                <div className="space-y-6">
                    <Button variant="ghost" onClick={() => setAnalysisResult(null)} className="text-slate-500 hover:text-teal-600 gap-2">
                        &larr; Volver a Nuevo Análisis
                    </Button>
                    <RagReportView
                        numeroPedido={analysisResult.pedido_id}
                        modelos={analysisResult.modelos}
                        riesgos={analysisResult.riesgos}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Lado Izquierdo: Zona de Carga */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Upload size={120} />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">Nuevo Análisis</CardTitle>
                                <CardDescription className="text-slate-400">Suelta el PDF del {entity.name.toLowerCase()} aquí</CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-teal-500 transition-all cursor-pointer bg-slate-800/50 group"
                                >
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        accept=".pdf"
                                    />
                                    <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <Upload size={24} />
                                    </div>
                                    <p className="text-sm font-medium">{file ? file.name : "Haz clic para buscar"}</p>
                                    <p className="text-xs text-slate-500 mt-1 uppercase font-bold">PDF de {entity.name.toLowerCase()} (Max 10MB)</p>
                                </div>
                                <Button
                                    onClick={ingestAndStartAnalysis}
                                    disabled={!file || isUploading || showTrace}
                                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white border-none py-6 text-lg font-bold shadow-teal-500/20 shadow-lg active:scale-[0.98] transition-transform"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : `Analizar ${entity.name}`}
                                </Button>
                            </CardContent>
                        </Card>

                        {showTrace && currentPedidoId && (
                            <div className="animate-in fade-in zoom-in duration-500">
                                <AgentTraceViewer
                                    pedidoId={currentPedidoId}
                                    onComplete={handleAnalysisComplete}
                                />
                            </div>
                        )}

                        <Card className="border-none shadow-lg bg-teal-50/50 dark:bg-slate-900/50">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-teal-600 mt-1 shrink-0" size={18} />
                                    <p className="text-sm text-slate-700 dark:text-slate-300">Detección automática de modelos y componentes.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-teal-600 mt-1 shrink-0" size={18} />
                                    <p className="text-sm text-slate-700 dark:text-slate-300">Cruce inteligente con manuales vigentes.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-teal-600 mt-1 shrink-0" size={18} />
                                    <p className="text-sm text-slate-700 dark:text-slate-300">Checklist de compatibilidad generado por IA.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lado Derecho: Historial / Recientes PURE REAL DATA */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recientes</h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <Input
                                        placeholder={`Buscar ${entity.plural.toLowerCase()}...`}
                                        className="pl-9 w-64 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm focus:ring-teal-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {isLoadingList ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-2xl" />
                                ))
                            ) : pedidos && pedidos.length > 0 ? (
                                pedidos.map((p: any) => (
                                    <Card
                                        key={p._id}
                                        className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 group cursor-pointer border-l-4 border-l-teal-500"
                                    >
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div
                                                className="flex items-center gap-4 flex-1"
                                                onClick={() => {
                                                    setCurrentPedidoId(p._id);
                                                    handleAnalysisComplete();
                                                }}
                                            >
                                                <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl group-hover:text-teal-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 transition-all duration-300">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                                                        {p.numero_pedido || p.nombre_archivo}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5 border-teal-500/20 text-teal-600 bg-teal-50/50">
                                                            {(p.modelos_detectados?.length || 0)} Modelos
                                                        </Badge>
                                                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                            {formatDateTime(p.creado || p.fecha_analisis)}
                                                        </span>
                                                        <Badge className={cn(
                                                            "text-[10px] uppercase font-bold py-0 h-5",
                                                            p.estado === 'analizado' ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"
                                                        )}>
                                                            {p.estado}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        editModal.openEdit(p);
                                                    }}
                                                    className="text-slate-300 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ArrowRight size={20} className="-rotate-45" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-slate-300 group-hover:text-teal-600 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 transition-all"
                                                    onClick={() => {
                                                        setCurrentPedidoId(p._id);
                                                        handleAnalysisComplete();
                                                    }}
                                                >
                                                    <ArrowRight size={20} />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-12 text-center">
                                    <div className="flex flex-col items-center gap-4 text-slate-400">
                                        <FileText size={48} className="opacity-20" />
                                        <p className="font-medium">No se han analizado {entity.plural} recientemente.</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <DynamicFormModal
                open={editModal.isOpen}
                entitySlug="pedido"
                mode="edit"
                initialData={editModal.data}
                onClose={() => editModal.close()}
                onSuccess={() => {
                    refresh();
                    editModal.close();
                }}
            />
        </div>
    );
}
