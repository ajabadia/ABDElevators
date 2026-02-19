"use client";

import React from "react";
import { FileText, ClipboardCheck, Microscope, GitBranch, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Template {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    recommended?: boolean;
    color: string;
}

interface ReportTemplateSelectorProps {
    selectedId: string;
    onSelect: (id: string) => void;
    className?: string;
}

const templates: Template[] = [
    {
        id: "inspection",
        title: "Informe de Inspección",
        description: "Análisis detallado de especificaciones técnicas y componentes del ascensor.",
        icon: <ClipboardCheck className="w-6 h-6" />,
        recommended: true,
        color: "text-blue-600 bg-blue-50 border-blue-100"
    },
    {
        id: "ragQuality",
        title: "Calidad RAG",
        description: "Auditoría de precisión y recuperación semántica de la base de conocimientos.",
        icon: <Microscope className="w-6 h-6" />,
        color: "text-purple-600 bg-purple-50 border-purple-100"
    },
    {
        id: "audit",
        title: "Auditoría de Cumplimiento",
        description: "Validación normativa y legal de la documentación técnica.",
        icon: <FileText className="w-6 h-6" />,
        color: "text-teal-600 bg-teal-50 border-teal-100"
    },
    {
        id: "workflow",
        title: "Estado de Workflow",
        description: "Informe ejecutivo sobre el progreso de tareas y cuellos de botella.",
        icon: <GitBranch className="w-6 h-6" />,
        color: "text-amber-600 bg-amber-50 border-amber-100"
    }
];

/**
 * ReportTemplateSelector - ERA 6 UI Improvement
 * A visual, card-based selector for report templates.
 */
export function ReportTemplateSelector({
    selectedId,
    onSelect,
    className
}: ReportTemplateSelectorProps) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
            {templates.map((template) => {
                const isSelected = selectedId === template.id;

                return (
                    <Card
                        key={template.id}
                        onClick={() => onSelect(template.id)}
                        className={cn(
                            "relative cursor-pointer transition-all duration-300 border-2 overflow-hidden group",
                            isSelected
                                ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                                : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-sm"
                        )}
                    >
                        {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                        )}

                        <CardContent className="p-5">
                            <div className="flex gap-4">
                                <div className={cn(
                                    "p-3 rounded-xl transition-transform group-hover:scale-110 duration-300",
                                    template.color
                                )}>
                                    {template.icon}
                                </div>
                                <div className="space-y-1 pr-6">
                                    <div className="flex items-center gap-2">
                                        <h4 className={cn(
                                            "font-bold text-sm tracking-tight",
                                            isSelected ? "text-primary" : "text-slate-900"
                                        )}>
                                            {template.title}
                                        </h4>
                                        {template.recommended && (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-tighter shadow-none">
                                                <Sparkles className="w-2.5 h-2.5 mr-1" /> RECOMENDADO
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        {template.description}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
