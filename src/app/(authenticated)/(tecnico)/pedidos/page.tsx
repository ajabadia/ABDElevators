"use client";

import { useState } from "react";
import { Upload, FileText, Search, Zap, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RagReportView } from "@/components/tecnico/RagReportView";
import { useLabels } from "@/hooks/use-labels";

export default function PedidosPage() {
    const labels = useLabels();
    const [isUploading, setIsUploading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const runAnalysis = async () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const resp = await fetch("/api/tecnico/pedidos/analyze", {
                method: "POST",
                body: formData,
            });
            const data = await resp.json();
            if (data.success) {
                setAnalysisResult(data);
            } else {
                alert(`Error en el análisis de ${labels.singular}: ` + data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Error fatal conectando con el servidor técnico");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Sección */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900 font-outfit">
                        Análisis de <span className="text-teal-600">{labels.plural} Técnico</span>
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        {labels.description}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                    <Zap size={16} className="text-amber-500" />
                    Powered by Gemini 2.0 Flash
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
                                <CardDescription className="text-slate-400">Suelta el PDF del {labels.singular.toLowerCase()} aquí</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                                    <p className="text-xs text-slate-500 mt-1 uppercase font-bold">PDF de {labels.singular.toLowerCase()} (Max 10MB)</p>
                                </div>
                                <Button
                                    onClick={runAnalysis}
                                    disabled={!file || isUploading}
                                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white border-none py-6 text-lg font-bold"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Analizando con Gemini 2.0...
                                        </>
                                    ) : `Iniciar ${labels.action}`}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-teal-50/50">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-teal-600 mt-1" size={18} />
                                    <p className="text-sm text-slate-700">Detección automática de modelos y componentes.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-teal-600 mt-1" size={18} />
                                    <p className="text-sm text-slate-700">Cruce inteligente con manuales vigentes.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-teal-600 mt-1" size={18} />
                                    <p className="text-sm text-slate-700">Checklist de compatibilidad generado por IA.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lado Derecho: Historial / Recientes */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">{labels.recent_title}</h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <Input placeholder={`Buscar ${labels.singular.toLowerCase()}...`} className="pl-9 w-64 bg-white border-slate-200" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Item de Pedido (Demo) */}
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white group cursor-pointer border-l-4 border-l-teal-500">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-slate-50 text-slate-400 rounded-lg">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg">{labels.singular.toUpperCase()}_#2290{i}_VALENCIA</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5">4 Modelos Detectados</Badge>
                                                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Hace 2 horas</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-slate-300 group-hover:text-teal-600 group-hover:bg-teal-50">
                                            <ArrowRight size={20} />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
