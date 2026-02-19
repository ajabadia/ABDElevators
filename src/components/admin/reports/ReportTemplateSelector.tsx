"use client";

import React from "react";
import {
    FileText,
    ClipboardCheck,
    Microscope,
    GitBranch,
    Sparkles,
    Check,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Template {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    recommended?: boolean;
    colorClass: string;
    iconClass: string;
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
        description: "Análisis técnico exhaustivo de especificaciones y componentes.",
        icon: <ClipboardCheck className="w-6 h-6" />,
        recommended: true,
        colorClass: "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30",
        iconClass: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30"
    },
    {
        id: "ragQuality",
        title: "Auditoría de IA",
        description: "Análisis de precisión, alucinaciones y cobertura semántica.",
        icon: <Microscope className="w-6 h-6" />,
        colorClass: "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30",
        iconClass: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30"
    },
    {
        id: "audit",
        title: "Cumplimiento Legal",
        description: "Validación normativa y detección de riesgos contractuales.",
        icon: <FileText className="w-6 h-6" />,
        colorClass: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30",
        iconClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30"
    },
    {
        id: "workflow",
        title: "Estado de Proyecto",
        description: "Progreso de tareas, cuellos de botella y eficiencia operativa.",
        icon: <GitBranch className="w-6 h-6" />,
        colorClass: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30",
        iconClass: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30"
    }
];

/**
 * ReportTemplateSelector - ERA 6 (FASE 192)
 * 
 * Visual card-based selector with premium aesthetics and design tokens.
 */
export function ReportTemplateSelector({
    selectedId,
    onSelect,
    className
}: ReportTemplateSelectorProps) {
    return (
        <div className={cn("grid grid-cols-1 gap-3", className)}>
            {templates.map((template) => {
                const isSelected = selectedId === template.id;

                return (
                    <div
                        key={template.id}
                        onClick={() => onSelect(template.id)}
                        className={cn(
                            "relative flex items-center p-4 cursor-pointer transition-all duration-300 border-2 rounded-2xl group",
                            isSelected
                                ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm"
                        )}
                    >
                        {/* Selector Indicator */}
                        <div className={cn(
                            "absolute right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected
                                ? "bg-primary border-primary text-white scale-110"
                                : "border-slate-200 group-hover:border-primary/50 text-transparent"
                        )}>
                            <Check className="w-3.5 h-3.5 stroke-[4]" />
                        </div>

                        <div className="flex gap-4 items-center pr-10">
                            <div className={cn(
                                "flex-shrink-0 p-3 rounded-xl transition-all duration-300 group-hover:rotate-6",
                                template.iconClass
                            )}>
                                {template.icon}
                            </div>

                            <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className={cn(
                                        "font-black text-sm uppercase tracking-tight",
                                        isSelected ? "text-primary" : "text-slate-900 dark:text-slate-100"
                                    )}>
                                        {template.title}
                                    </h4>
                                    {template.recommended && (
                                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black tracking-[0.1em] px-1.5 py-0 h-4">
                                            <Sparkles size={8} className="mr-1" /> RECOMENDADO
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                                    {template.description}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
