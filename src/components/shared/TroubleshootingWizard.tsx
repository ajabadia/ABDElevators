"use client";

import React, { useState } from "react";
import {
    AlertCircle,
    FileWarning,
    ShieldAlert,
    FileCheck,
    ChevronRight,
    ExternalLink,
    HelpCircle,
    RotateCcw,
    MousePointer2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IssueCategory {
    id: string;
    title: string;
    description: string;
    icon: any;
    solutions: string[];
}

const ISSUE_CATEGORIES: IssueCategory[] = [
    {
        id: "format",
        title: "Problema de Formato o Seguridad",
        description: "¿El PDF está protegido, cifrado o tiene un formato no estándar?",
        icon: ShieldAlert,
        solutions: [
            "Elimina contraseñas antes de subir.",
            "Exporta a PDF 1.7 o inferior.",
            "Prueba a convertir a .txt o .docx."
        ]
    },
    {
        id: "visual",
        title: "Contenido Visual/OCR",
        description: "¿El documento es una imagen o tiene texto no seleccionable?",
        icon: MousePointer2,
        solutions: [
            "Activa el modo de OCR Avanzado en opciones.",
            "Asegura que el escaneo tenga al menos 300dpi.",
            "Usa el motor de Visión (experimental)."
        ]
    },
    {
        id: "size",
        title: "Tamaño o Complejidad",
        description: "¿Es un documento masivo (>50MB) o con miles de páginas?",
        icon: FileWarning,
        solutions: [
            "Divide el documento en capítulos menores.",
            "Elimina imágenes no críticas para reducir peso.",
            "Usa ingesta por lotes (Bucket Sync)."
        ]
    }
];

interface TroubleshootingWizardProps {
    filename: string;
    onRetry: () => void;
    onDismiss: () => void;
}

export function TroubleshootingWizard({ filename, onRetry, onDismiss }: TroubleshootingWizardProps) {
    const [selectedCategory, setSelectedCategory] = useState<IssueCategory | null>(null);

    return (
        <Card className="border-rose-200 shadow-2xl bg-white dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />

            <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                    <Badge variant="destructive" className="text-[10px] font-black tracking-widest uppercase px-3 py-1">
                        Ingestion Failure Detected
                    </Badge>
                    <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600">
                        <RotateCcw size={16} className="rotate-45" />
                    </button>
                </div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <AlertCircle className="text-rose-500 w-6 h-6" />
                    ¿Qué ha pasado con <span className="text-rose-600 truncate max-w-[200px]">{filename}</span>?
                </CardTitle>
                <CardDescription>
                    La IA no ha podido procesar este archivo. Selecciona el síntoma más probable para recibir una solución.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {!selectedCategory ? (
                    <div className="grid grid-cols-1 gap-3">
                        {ISSUE_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat)}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-rose-300 hover:bg-rose-500/5 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <cat.icon size={20} className="text-slate-400 group-hover:text-rose-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cat.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{cat.description}</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <HelpCircle size={14} /> Soluciones Recomendadas
                            </h4>
                            <ul className="space-y-3">
                                {selectedCategory.solutions.map((sol, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                                            {i + 1}
                                        </div>
                                        {sol}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <a
                                    href="/admin/support"
                                    className="text-xs text-indigo-500 font-bold flex items-center gap-1 hover:underline"
                                >
                                    Abrir ticket técnico <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedCategory(null)}>
                                Ver otros síntomas
                            </Button>
                            <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" onClick={onRetry}>
                                Intentar de nuevo
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
