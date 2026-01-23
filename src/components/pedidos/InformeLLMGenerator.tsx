"use client";

import { useState } from "react";
import { FileText, Download, Loader2, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';

interface InformeLLMGeneratorProps {
    pedidoId: string;
    isValidated: boolean;
}

export function InformeLLMGenerator({ pedidoId, isValidated }: InformeLLMGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [informe, setInforme] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch(`/api/pedidos/${pedidoId}/generar-informe`, {
                method: 'POST',
            });

            const data = await res.json();

            if (data.success) {
                setInforme({
                    id: data.informeId,
                    contenido: data.contenido,
                    metadata: data.metadata,
                    timestamp: new Date()
                });
            } else {
                setError(data.message || 'Error al generar el informe');
            }
        } catch (err) {
            setError('Error de conexión al generar el informe');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = () => {
        // TODO: Implementar generación de PDF con jsPDF
        alert('Funcionalidad de descarga PDF próximamente');
    };

    if (!isValidated) {
        return (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">
                                Validación Requerida
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                El pedido debe estar validado y aprobado antes de generar el informe profesional con IA.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header con botón de generación */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="border-b border-slate-100 dark:border-slate-900">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Sparkles className="text-purple-500" size={18} />
                            Informe Profesional con IA
                        </CardTitle>
                        {!informe && (
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generar Informe
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Genera un informe técnico profesional utilizando inteligencia artificial.
                        El informe incluye análisis detallado, cumplimiento normativo y recomendaciones basadas en la validación aprobada.
                    </p>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-red-900 dark:text-red-100 mb-1">Error</h3>
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Informe Generado */}
            {informe && (
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-900 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <CheckCircle className="text-purple-600 dark:text-purple-400" size={20} />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Informe Generado</CardTitle>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {new Date(informe.timestamp).toLocaleString('es-ES')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleDownloadPDF}
                                    variant="outline"
                                    size="sm"
                                    className="font-bold"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Descargar PDF
                                </Button>
                                <Button
                                    onClick={handleGenerate}
                                    variant="outline"
                                    size="sm"
                                    disabled={isGenerating}
                                >
                                    Regenerar
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {/* Metadata */}
                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Modelo IA</p>
                                    <p className="font-mono font-bold">{informe.metadata?.modelo || 'Gemini 2.0'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Tokens Usados</p>
                                    <p className="font-mono font-bold">{Math.round(informe.metadata?.tokensUsados || 0)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Temperatura</p>
                                    <p className="font-mono font-bold">{informe.metadata?.temperatura || 0.3}</p>
                                </div>
                            </div>
                        </div>

                        {/* Contenido del Informe */}
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <ReactMarkdown
                                components={{
                                    h1: ({ children, ...props }: any) => <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4" {...props}>{children}</h1>,
                                    h2: ({ children, ...props }: any) => <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4" {...props}>{children}</h2>,
                                    h3: ({ children, ...props }: any) => <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-6 mb-3" {...props}>{children}</h3>,
                                    p: ({ children, ...props }: any) => <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4" {...props}>{children}</p>,
                                    ul: ({ children, ...props }: any) => <ul className="list-disc list-inside space-y-2 mb-4" {...props}>{children}</ul>,
                                    ol: ({ children, ...props }: any) => <ol className="list-decimal list-inside space-y-2 mb-4" {...props}>{children}</ol>,
                                    li: ({ children, ...props }: any) => <li className="text-slate-600 dark:text-slate-300" {...props}>{children}</li>,
                                    strong: ({ children, ...props }: any) => <strong className="font-bold text-slate-900 dark:text-white" {...props}>{children}</strong>,
                                    code: ({ children, ...props }: any) => <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono" {...props}>{children}</code>,
                                }}
                            >
                                {informe.contenido}
                            </ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
