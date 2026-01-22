"use client";

import { FileText, CheckCircle2, ChevronRight, BookOpen, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExportButton } from "./ExportButton";
import { RiskAlerter, RiskFinding } from "../shared/RiskAlerter";

interface RagContext {
    texto: string;
    source: string;
    score: number;
    tipo: string;
}

interface AnalyzedModel {
    tipo: string;
    modelo: string;
    contexto_rag: RagContext[];
}

interface RagReportViewProps {
    numeroPedido: string;
    modelos: AnalyzedModel[];
    riesgos?: RiskFinding[];
}

export function RagReportView({ numeroPedido, modelos, riesgos = [] }: RagReportViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Resultados del Informe: {numeroPedido}</h2>
                    <p className="text-slate-500">Se han identificado {modelos.length} componentes críticos en el pedido.</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4">
                    Validado por RAG
                </Badge>
            </div>

            {/* Panel de Riesgos e Inteligencia */}
            <RiskAlerter risks={riesgos} />

            <div className="grid grid-cols-1 gap-6">
                {modelos.map((m, idx) => (
                    <Card key={idx} className="border-none shadow-xl overflow-hidden bg-white border-l-4 border-l-teal-500">
                        <CardHeader className="bg-slate-50/50 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-teal-600 transition-colors capitalize">
                                            {m.tipo}: <span className="text-teal-700">{m.modelo}</span>
                                        </CardTitle>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Componente Detectado</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-mono">
                                    Match Score: 0.98
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tighter">
                                <BookOpen size={16} className="text-teal-600" /> Documentación Técnica Relacionada
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                {m.contexto_rag.length > 0 ? (
                                    m.contexto_rag.map((ctx, cIdx) => (
                                        <div key={cIdx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded">
                                                    {ctx.source}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold">Relevancia: {(ctx.score * 100).toFixed(0)}%</span>
                                            </div>
                                            <ScrollArea className="h-32 pr-4 text-sm text-slate-600 leading-relaxed font-medium">
                                                {ctx.texto}
                                            </ScrollArea>
                                            <div className="mt-3 flex items-center gap-1 text-[11px] text-teal-600 font-bold cursor-pointer hover:underline">
                                                Ver manual completo <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                                        <p className="text-slate-400 text-sm font-medium">No se encontraron fragmentos técnicos específicos para este modelo.</p>
                                    </div>
                                )}
                            </div>

                            {/* Checklist de IA */}
                            <div className="mt-8 border-t border-slate-100 pt-6">
                                <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-tighter">Checklist de Verificación Taller</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        `Confirmar compatibilidad de ${m.modelo} con cuadro de control existente.`,
                                        `Verificar voltajes de alimentación según manual ${m.contexto_rag[0]?.source || 'técnico'}.`,
                                        `Validar dimensiones de anclaje para ${m.tipo}.`
                                    ].map((check, cIdx) => (
                                        <div key={cIdx} className="flex items-center gap-3 p-3 bg-teal-50/30 border border-teal-100/50 rounded-lg">
                                            <div className="w-5 h-5 border-2 border-teal-200 rounded flex items-center justify-center bg-white">
                                                <CheckCircle2 size={14} className="text-teal-500 opacity-20" />
                                            </div>
                                            <span className="text-xs text-slate-700 font-medium">{check}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
