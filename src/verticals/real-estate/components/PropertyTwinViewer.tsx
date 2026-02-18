import React, { useState } from 'react';
import {
    Maximize2,
    Download,
    ChevronLeft,
    ChevronRight,
    Layers,
    Eye,
    Info,
    Search,
    BrainCircuit,
    Zap,
    AlertCircle,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { CausalFlow } from './CausalFlow';

interface Finding {
    id: string;
    label: string;
    type: string;
    page: number;
    coordinates?: { x: number, y: number };
    severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface CausalAnalysis {
    chain: { level: number, effect: string, risk: string, description: string }[];
    mitigation: { action: string, urgency: string, estimated_cost_impact: string };
}

interface PropertyTwinViewerProps {
    assetId: string;
    filename: string;
    initialPage?: number;
    findings?: Finding[];
    className?: string;
}

/**
 * 🏢 Property Twin Viewer
 * Componente premium para visualizar planos técnicos vinculados a hallazgos RAG.
 * Ahora con soporte para Análisis de Impacto Causal (Fase 86).
 */
export function PropertyTwinViewer({
    assetId,
    filename,
    initialPage = 1,
    findings = [],
    className = ""
}: PropertyTwinViewerProps) {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<CausalAnalysis | null>(null);

    // Construir URL de previsualización (soporte nativo para #page)
    const previewUrl = `/api/admin/knowledge-assets/${assetId}/preview#page=${currentPage}`;
    const downloadUrl = `/api/admin/knowledge-assets/${assetId}/download`;

    const handleNextPage = () => setCurrentPage(prev => prev + 1);
    const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));

    const handleSimulateImpact = async (finding: Finding) => {
        setSelectedFinding(finding);
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            const response = await fetch('/api/intelligence/causal-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    finding: finding.label,
                    context: `Real Estate finding in page ${finding.page}`
                })
            });

            if (!response.ok) throw new Error('Failed to analyze');
            const data = await response.json();
            setAnalysisResult(data.analysis);
        } catch (error) {
            console.error('Causal Analysis Error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col lg:flex-row gap-6">
                <Card className={`flex-1 overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl bg-slate-50/30 dark:bg-slate-900/10 ${className}`}>
                    <CardHeader className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400">
                                <Layers size={18} />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold truncate max-w-[300px]">
                                    {filename}
                                </CardTitle>
                                <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Digital Twin: Real Estate
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[10px] px-2 py-0 border-slate-200 dark:border-slate-800">
                                PÁG {currentPage}
                            </Badge>
                            <div className="flex bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md"
                                    onClick={handlePrevPage}
                                    disabled={currentPage <= 1}
                                >
                                    <ChevronLeft size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md"
                                    onClick={handleNextPage}
                                >
                                    <ChevronRight size={14} />
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
                                onClick={() => window.open(downloadUrl, '_blank')}
                                title="Download Document"
                            >
                                <Download size={14} />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 h-[600px] relative bg-slate-200 dark:bg-black/40">
                        {/* Visualitzador PDF via Iframe */}
                        <iframe
                            src={previewUrl}
                            className="w-full h-full border-0"
                            title={`Plan: ${filename}`}
                        />

                        {/* Overlay de Hallazgos */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                            {findings.filter(f => f.page === currentPage).length > 0 && (
                                <Badge className="bg-blue-600 hover:bg-blue-600 text-white border-none shadow-lg animate-in fade-in slide-in-from-left-4 duration-500">
                                    <Eye size={12} className="mr-1.5" /> {findings.filter(f => f.page === currentPage).length} Hallazgos en esta planta
                                </Badge>
                            )}
                            {findings.filter(f => f.page === currentPage).map(finding => (
                                <Tooltip key={finding.id}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`p-2 rounded-lg border shadow-sm flex items-center gap-2 max-w-[200px] pointer-events-auto transition-all cursor-pointer hover:scale-105 ${selectedFinding?.id === finding.id ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/95 dark:bg-slate-950/95 border-blue-200 dark:border-blue-900'}`}
                                            onClick={() => handleSimulateImpact(finding)}
                                        >
                                            <Info size={14} className={selectedFinding?.id === finding.id ? 'text-white' : 'text-blue-500'} />
                                            <span className="text-[10px] font-medium truncate">{finding.label}</span>
                                            {selectedFinding?.id === finding.id && isAnalyzing && <Loader2 size={12} className="animate-spin" />}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p>Click para simular impacto causal</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>

                        {/* Floating Search in Plan */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-2xl flex items-center gap-1 z-20">
                            <div className="pl-3 pr-1 py-1">
                                <Search size={14} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar en plano..."
                                className="bg-transparent border-none text-[11px] focus:ring-0 w-32 font-medium"
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl">
                                <Maximize2 size={14} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar de Análisis Causal */}
                <Card className="w-full lg:w-96 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <BrainCircuit className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold">Causal AI Analysis</CardTitle>
                                <CardDescription className="text-[10px]">What-If Simulation Engine</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                        {!selectedFinding ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-black/10">
                                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Zap className="text-slate-400" size={20} />
                                </div>
                                <p className="text-sm font-medium text-slate-500">Selecciona un hallazgo en el plano para simular su impacto causal</p>
                            </div>
                        ) : isAnalyzing ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <div className="text-center">
                                    <p className="text-sm font-bold">Ejecutando razonamiento agéntico...</p>
                                    <p className="text-[10px] text-slate-500 italic mt-1 font-mono">Simulando consecuencias de primer, segundo y tercer orden</p>
                                </div>
                            </div>
                        ) : analysisResult ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="p-4 bg-blue-500/5 border-b border-blue-500/10 shrink-0">
                                    <p className="text-[10px] uppercase font-black text-blue-500 tracking-wider mb-1">Impacto Inicial Detectado</p>
                                    <p className="text-sm font-bold">{selectedFinding.label}</p>
                                </div>

                                <ScrollArea className="flex-1">
                                    <div className="flex flex-col">
                                        <CausalFlow analysis={analysisResult} findingLabel={selectedFinding.label} />

                                        <div className="p-6 space-y-6">
                                            {/* Mitigación Detallada */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-emerald-500">
                                                    <CheckCircle2 size={16} />
                                                    <h4 className="text-[10px] uppercase font-black tracking-widest">Plan de Mitigación Recomendado</h4>
                                                </div>
                                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                                                    <p className="text-xs font-bold mb-3">{analysisResult.mitigation.action}</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <p className="text-[8px] uppercase font-bold text-slate-400">Urgencia</p>
                                                            <p className="text-[10px] font-bold text-emerald-600">{analysisResult.mitigation.urgency}</p>
                                                        </div>
                                                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <p className="text-[8px] uppercase font-bold text-slate-400">Coste Estimado</p>
                                                            <p className="text-[10px] font-bold">{analysisResult.mitigation.estimated_cost_impact}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator className="bg-slate-100 dark:bg-slate-800" />

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <AlertCircle size={14} />
                                                    <h4 className="text-[10px] uppercase font-black">Detalle de Riesgos Adicionales</h4>
                                                </div>
                                                <div className="space-y-3">
                                                    {analysisResult.chain.slice(1).map((step, idx) => (
                                                        <div key={idx} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[9px] font-bold text-slate-400">NIVEL {step.level}</span>
                                                                <Badge variant="outline" className="text-[8px] h-4 border-amber-500/30 text-amber-600">
                                                                    {step.risk}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{step.effect}</p>
                                                            <p className="text-[10px] text-slate-500 italic mt-1">{step.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}
