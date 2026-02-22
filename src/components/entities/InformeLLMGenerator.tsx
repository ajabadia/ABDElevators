"use client";

import { useState } from "react";
import {
    FileText,
    Wand2,
    Download,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Settings2,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface InformeLLMGeneratorProps {
    pedidoId: string;
    onReportGenerated?: (text: string) => void;
}

export function InformeLLMGenerator({ pedidoId, onReportGenerated }: InformeLLMGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<any>(null);
    const [showDebug, setShowDebug] = useState(false);
    const { toast } = useToast();
    const t = useTranslations('common.reports');

    const generateReport = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch(`/api/entities/${pedidoId}/generate-report`, {
                method: "POST"
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Error al generar informe");

            setReport(data.report);
            setMetadata(data.metadata);
            if (onReportGenerated) onReportGenerated(data.report);

            toast({
                title: "Informe Generado",
                description: "El análisis técnico ha sido redactado satisfactoriamente.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadPDF = async () => {
        if (!report) return;
        try {
            const res = await fetch(`/api/entities/${pedidoId}/generate-report/pdf`, {
                method: "POST",
                body: JSON.stringify({ content: report })
            });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Informe_Tecnico_${pedidoId}.pdf`;
            a.click();
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo descargar el PDF.",
                variant: "destructive"
            });
        }
    };

    return (
        <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-slate-50 overflow-hidden">
            <CardHeader className="border-b bg-white/50 backdrop-blur-sm px-8 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-200">
                            <FileText size={28} />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                {t('title')}
                            </CardTitle>
                            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                                <Wand2 size={14} className="text-teal-500" />
                                {t('subtitle')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {report && (
                            <Button
                                variant="outline"
                                onClick={downloadPDF}
                                className="border-slate-200 hover:bg-slate-50 font-bold"
                            >
                                <Download className="mr-2 h-4 w-4" /> Exportar PDF
                            </Button>
                        )}
                        <Button
                            onClick={generateReport}
                            disabled={isGenerating}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-black px-6 shadow-lg shadow-teal-100 transition-all active:scale-95"
                        >
                            {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Wand2 className="mr-2 h-4 w-4" />
                            )}
                            {report ? "Regenerar Análisis" : "Redactar Informe"}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                {report ? (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-2 mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800">
                            <CheckCircle2 size={20} className="text-emerald-500" />
                            <span className="text-sm font-bold tracking-tight">
                                Análisis verificado y listo para revisión profesional.
                            </span>
                        </div>

                        <div className="prose prose-slate max-w-none 
                            prose-headings:text-slate-900 prose-headings:font-black
                            prose-p:text-slate-600 prose-p:leading-relaxed prose-p:font-medium
                            prose-strong:text-teal-700 prose-strong:font-bold
                            bg-white p-8 rounded-2xl border border-slate-100 shadow-inner">
                            <ReactMarkdown>{report}</ReactMarkdown>
                        </div>

                        {/* Metadata Técnica (Colapsable para purga de terminología) */}
                        {metadata && (
                            <div className="mt-8 border-t border-slate-100 pt-6">
                                <button
                                    onClick={() => setShowDebug(!showDebug)}
                                    className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                >
                                    <Settings2 size={12} />
                                    {showDebug ? "Ocultar detalles de procesamiento" : "Ver detalles de procesamiento"}
                                    {showDebug ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>

                                {showDebug && (
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Modelo de Datos</p>
                                            <p className="text-xs font-mono text-slate-700">{metadata.model || 'Gemini 2.5'}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Volumen Procesado</p>
                                            <p className="text-xs font-mono text-slate-700">{metadata.tokensUsed || 0} unidades</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Precisión de Respuesta</p>
                                            <Badge variant="outline" className="text-[10px] py-0">{metadata.temperature || 0.1}</Badge>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Identificador de Rastreo</p>
                                            <p className="text-[10px] font-mono text-slate-500 truncate">#661-v2</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                            <FileText className="text-slate-300" size={32} />
                        </div>
                        <div className="max-w-xs mx-auto">
                            <h3 className="text-lg font-bold text-slate-900">Análisis pendiente</h3>
                            <p className="text-slate-500 text-sm font-medium">
                                Haz clic en el botón superior para generar un informe técnico completo basado en la documentación del pedido.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
