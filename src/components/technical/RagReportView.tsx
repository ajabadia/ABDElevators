import React, { useState, useEffect } from "react";
import { FileText, CheckCircle2, ChevronRight, BookOpen, AlertCircle, Globe, Zap, MessageSquare, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ExportButton } from "./ExportButton";
import { RiskAlerter, RiskFinding } from "../shared/RiskAlerter";
import { CollaborationPanel } from "./CollaborationPanel";
import { FederatedPatternCard } from "../federated/FederatedPatternCard";
import { FederatedPattern } from "@/lib/schemas";
import { FeatureFlags } from "@/lib/feature-flags";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface RagContext {
    text: string;
    source: string;
    score: number;
    type: string;
}

interface AnalyzedModel {
    type: string;
    model: string;
    ragContext: RagContext[];
}

interface ChecklistItem {
    id: string;
    description: string;
    completed: boolean;
}

interface RagReportViewProps {
    id: string; // Internal DB _id for APIs
    identifier: string;
    detectedPatterns: AnalyzedModel[];
    risks?: RiskFinding[];
    federatedInsights?: FederatedPattern[];
    confidence?: number;
    checklist?: ChecklistItem[];
}

export function RagReportView({
    id,
    identifier,
    detectedPatterns,
    risks = [],
    federatedInsights = [],
    confidence = 0.98,
    checklist = []
}: RagReportViewProps) {
    const t = useTranslations('common.reports');
    const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>(checklist);
    const [isUpdatingChecklist, setIsUpdatingChecklist] = useState<string | null>(null);

    // Initialize checklist with defaults if empty
    useEffect(() => {
        if (checklist.length > 0) {
            setLocalChecklist(checklist);
        } else {
            // Generate some default items based on patterns if none exist
            const defaults = detectedPatterns.flatMap((m, mIdx) => [
                { id: `check-${mIdx}-1`, description: `Confirmar compatibilidad de ${m.model} con el panel de control existente.`, completed: false },
                { id: `check-${mIdx}-2`, description: `Verificar voltajes de alimentación según manual ${m.ragContext[0]?.source || 'técnico'}.`, completed: false }
            ]);
            setLocalChecklist(defaults);
        }
    }, [id, checklist, detectedPatterns]);

    const toggleCheckItem = async (itemId: string, currentStatus: boolean) => {
        setIsUpdatingChecklist(itemId);
        try {
            const res = await fetch(`/api/entities/${id}/checklist`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, completed: !currentStatus }),
            });
            if (res.ok) {
                setLocalChecklist(prev => prev.map(item =>
                    item.id === itemId ? { ...item, completed: !currentStatus } : item
                ));
            }
        } catch (error) {
            console.error('Error toggling checklist:', error);
        } finally {
            setIsUpdatingChecklist(null);
        }
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 0.8) return "text-emerald-500 bg-emerald-50 border-emerald-100";
        if (score >= 0.6) return "text-amber-500 bg-amber-50 border-amber-100";
        return "text-rose-500 bg-rose-50 border-rose-100";
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-bold py-0 h-5 border-slate-200 text-slate-400 bg-slate-50 uppercase tracking-tighter">
                            Reporte Técnico Generado
                        </Badge>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4">
                            {t('protocol')}
                        </Badge>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        {t('title')}: <span className="text-teal-600">{identifier}</span>
                    </h2>
                    <p className="text-slate-500 font-medium">{detectedPatterns.length} componentes críticos identificados por el Agente.</p>
                </div>

                {/* Score de Confianza Premium */}
                <div className={cn(
                    "p-4 rounded-2xl border flex flex-col items-center justify-center min-w-[160px] shadow-sm transition-all",
                    getConfidenceColor(confidence)
                )}>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-black tracking-widest">Confianza IA</span>
                    </div>
                    <div className="text-3xl font-black">{Math.round(confidence * 100)}%</div>
                    <div className="w-full mt-2 h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-current transition-all duration-1000"
                            style={{ width: `${confidence * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Risk & Intelligence Panel */}
                    <RiskAlerter risks={risks} />

                    {/* Federated Global Intelligence (Vision 2027) */}
                    {federatedInsights.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900 shadow-inner">
                            <div className="flex items-center gap-2 mb-4">
                                <Globe className="h-5 w-5 text-blue-600" />
                                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Colectivo de Inteligencia Global</h3>
                                <Badge variant="outline" className="ml-2 border-blue-400 text-blue-600">BETA</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {federatedInsights.map((insight, idx) => (
                                    <FederatedPatternCard key={idx} pattern={insight} />
                                ))}
                            </div>
                            <p className="mt-4 text-[10px] text-blue-400 font-medium italic">
                                * Estos datos provienen de la red federada anónima y han sido verificados por otros técnicos de la industria.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                        {detectedPatterns.map((m, idx) => (
                            <Card key={idx} className="border-none shadow-xl overflow-hidden bg-white border-l-4 border-l-teal-500 group">
                                <CardHeader className="bg-slate-50/50 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-teal-500/20">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-teal-600 transition-colors capitalize">
                                                    {m.type}: <span className="text-teal-700">{m.model}</span>
                                                </CardTitle>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Componente Detectado</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-mono">
                                            {t('compatibility')}: 0.98
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tighter">
                                        <BookOpen size={16} className="text-teal-600" /> Documentación Técnica Relacionada
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                        {(m.ragContext?.length || 0) > 0 ? (
                                            m.ragContext.map((ctx, cIdx) => (
                                                <div key={cIdx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded">
                                                            {ctx.source}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold">Relevancia: {(ctx.score * 100).toFixed(0)}%</span>
                                                    </div>
                                                    {FeatureFlags.isEnabled('EXPLAINABLE_AI') && (
                                                        <div className="mb-2 p-2 bg-yellow-50/50 border border-yellow-100 rounded text-[10px] text-yellow-800 italic">
                                                            <span className="font-bold not-italic text-yellow-900">Razonamiento:</span> Coincidencia de palabras clave para '{m.model}' y variante técnica.
                                                        </div>
                                                    )}
                                                    <ScrollArea className="h-32 pr-4 text-sm text-slate-600 leading-relaxed font-medium">
                                                        {ctx.text}
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
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Lateral Right: Checklists & Collaboration (Fase 82) */}
                <div className="space-y-6">
                    {/* Checklist Interactiva */}
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-teal-600 text-white p-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" /> Protocolo de Verificación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {localChecklist.map((item) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                                        item.completed
                                            ? "bg-emerald-50 border-emerald-100"
                                            : "bg-slate-50 border-slate-100 hover:border-teal-200"
                                    )}
                                    onClick={() => toggleCheckItem(item.id, item.completed)}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border-2 transition-all",
                                        item.completed
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "bg-white border-slate-200 group-hover:border-teal-400"
                                    )}>
                                        {isUpdatingChecklist === item.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : item.completed && (
                                            <CheckCircle2 size={14} />
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-medium leading-tight",
                                        item.completed ? "text-emerald-700 line-through opacity-70" : "text-slate-700"
                                    )}>
                                        {item.description}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Panel de Colaboración */}
                    <CollaborationPanel entityId={id} />
                </div>
            </div>
        </div>
    );
}

const Loader2 = ({ className }: { className?: string }) => (
    <div className={cn("w-4 h-4 border-2 border-slate-300 border-t-teal-500 rounded-full animate-spin", className)} />
);
