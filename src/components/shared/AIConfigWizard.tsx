"use client";

import React, { useState } from "react";
import { Brain, Zap, Shield, Search, ChevronRight, Check, Info, Component } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConfigOption {
    id: string;
    title: string;
    description: string;
    icon: any;
    impact: string;
}

const PERFORMANCE_OPTIONS: ConfigOption[] = [
    {
        id: "speed",
        title: "Velocidad Extrema",
        description: "Respuestas en < 2s. Ideal para consultas rápidas y uso diario.",
        icon: Zap,
        impact: "Ahorra 40% en tokens"
    },
    {
        id: "balanced",
        title: "Equilibrado",
        description: "Combinación óptima de precisión y latencia. Recomendado.",
        icon: Brain,
        impact: "P95 < 5s"
    },
    {
        id: "accuracy",
        title: "Máxima Precisión",
        description: "Deep Research activo. Analiza cada detalle matizado. Más lento.",
        icon: Search,
        impact: "Fidelity > 98%"
    }
];

const CONTENT_OPTIONS: ConfigOption[] = [
    {
        id: "text",
        title: "Solo Texto",
        description: "Documentos legales, contratos o manuales narrativos.",
        icon: Shield,
        impact: "Ingesta ultra-rápida"
    },
    {
        id: "complex",
        title: "Tablas y Diagramas",
        description: "Hojas de datos técnicas, planos y tablas financieras anidadas.",
        icon: Component,
        impact: "Requiere Vision Engine"
    }
];

export function AIConfigWizard() {
    const [step, setStep] = useState(1);
    const [perf, setPerf] = useState<string | null>(null);
    const [content, setContent] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    const handleApply = async () => {
        setIsApplying(true);
        try {
            // Simulated API call to update tenant config
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success("Configuración de Inteligencia Aplicada", {
                description: `Motor optimizado para ${perf === 'accuracy' ? 'Investigación Profunda' : 'Respuesta Rápida'}.`
            });
            setStep(4);
        } catch (error) {
            toast.error("Error al aplicar configuración");
        } finally {
            setIsApplying(false);
        }
    };

    if (step === 4) {
        return (
            <Card className="border-emerald-500/20 bg-emerald-500/5 overflow-hidden animate-in zoom-in-95 duration-500">
                <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="text-emerald-600 w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                        ¡Motor RAG Optimizado!
                    </CardTitle>
                    <CardDescription className="max-w-xs mx-auto text-slate-600">
                        Tu clúster de IA ha sido reconfigurado para tus necesidades específicas.
                    </CardDescription>
                    <Button variant="outline" onClick={() => setStep(1)} className="mt-4">
                        Reconfigurar
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Brain size={120} />
            </div>

            <CardHeader>
                <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase text-indigo-500 bg-indigo-500/5 border-indigo-500/20 px-3 py-1">
                        AI Decision Support
                    </Badge>
                    <span className="text-xs text-slate-400 font-bold">Paso {step} de 3</span>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    {step === 1 && "¿Qué buscas en tus respuestas?"}
                    {step === 2 && "¿Cómo son tus documentos?"}
                    {step === 3 && "Resumen de Optimización"}
                </CardTitle>
                <CardDescription>
                    {step === 1 && "Personaliza el balance entre velocidad y profundidad táctica."}
                    {step === 2 && "Dime si necesitamos activar el motor de visión para OCR avanzado."}
                    {step === 3 && "Confirma los cambios sugeridos por el optimizador de IA."}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {step === 1 && (
                    <div className="grid grid-cols-1 gap-3">
                        {PERFORMANCE_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => { setPerf(opt.id); setStep(2); }}
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group",
                                    perf === opt.id
                                        ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10"
                                        : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110",
                                    perf === opt.id ? "bg-indigo-500 text-white" : "bg-white dark:bg-slate-800 text-slate-400"
                                )}>
                                    <opt.icon size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{opt.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase text-indigo-500">
                                        <Zap size={10} /> {opt.impact}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 gap-3">
                        {CONTENT_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => { setContent(opt.id); setStep(3); }}
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group",
                                    content === opt.id
                                        ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                                        : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110",
                                    content === opt.id ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-800 text-slate-400"
                                )}>
                                    <opt.icon size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{opt.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500">
                                        <Info size={10} /> {opt.impact}
                                    </div>
                                </div>
                            </button>
                        ))}
                        <Button variant="ghost" className="text-xs text-slate-400" onClick={() => setStep(1)}>
                            Atrás
                        </Button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Modo de Respuesta</span>
                                <Badge variant="secondary">{perf?.toUpperCase()}</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Análisis de Visión</span>
                                <Badge variant="secondary">{content === 'complex' ? 'ACTIVO' : 'INACTIVO'}</Badge>
                            </div>
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-slate-400 italic">
                                    "Se aplicarán estos cambios a nivel de tenant. Podrás volver al modo experto en cualquier momento desde el panel de control."
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                                Atrás
                            </Button>
                            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleApply} disabled={isApplying}>
                                {isApplying ? "Aplicando..." : "Confirmar Cambios"}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
