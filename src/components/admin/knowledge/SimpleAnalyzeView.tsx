"use client";

import { useDropzone } from "react-dropzone";
import {
    Upload,
    FileText,
    X,
    Sparkles,
    ShieldCheck,
    ArrowRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SmartConfig } from "@/hooks/useSmartConfig";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface SimpleAnalyzeViewProps {
    file: File | null;
    onDrop: (files: File[]) => void;
    config: SmartConfig;
    isUploading: boolean;
    onUpload: () => void;
    onReset: () => void;
    className?: string;
}

/**
 * SimpleAnalyzeView - ERA 6 UX Revamp
 * A focused, high-usability interface for document analysis.
 * Hides technical complexity behind smart defaults.
 */
export function SimpleAnalyzeView({
    file,
    onDrop,
    config,
    isUploading,
    onUpload,
    onReset,
    className
}: SimpleAnalyzeViewProps) {
    const t = useTranslations("ingest");
    const tCommon = useTranslations("common");

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        disabled: isUploading || !!file
    });

    const levelLabels = {
        bajo: "Básico",
        medio: "Semántico (Recomendado)",
        alto: "IA Avanzada (Deep Analysis)"
    };

    const levelColors = {
        bajo: "bg-blue-100 text-blue-700 border-blue-200",
        medio: "bg-emerald-100 text-emerald-700 border-emerald-200",
        alto: "bg-indigo-100 text-indigo-700 border-indigo-200"
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={cn(
                    "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 min-h-[240px] flex flex-col items-center justify-center gap-4",
                    isDragActive
                        ? "border-primary bg-primary/5 scale-[0.99] shadow-inner"
                        : "border-slate-200 hover:border-primary/50 hover:bg-slate-50",
                    file ? "border-emerald-200 bg-emerald-50/30" : "cursor-pointer"
                )}
            >
                <input {...getInputProps()} />

                {!file ? (
                    <>
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-primary animate-in fade-in zoom-in duration-500">
                            <Upload className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xl font-bold text-slate-900 tracking-tight">
                                {t("dropzone.idle")}
                            </p>
                            <p className="text-sm text-slate-500">
                                {t("dropzone.format")} • Máx. 250MB
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="w-full animate-in zoom-in slide-in-from-bottom-2 duration-300">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-20 h-20 bg-white rounded-2xl shadow-md border border-emerald-100 flex items-center justify-center text-emerald-600">
                                    <FileText className="w-10 h-10" />
                                </div>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg border-2 border-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReset();
                                    }}
                                    disabled={isUploading}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="text-center space-y-1">
                                <p className="text-lg font-bold text-slate-900 truncate max-w-[300px]">
                                    {file.name}
                                </p>
                                <p className="text-xs text-slate-500 font-mono">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>

                            {/* Smart Config Badge */}
                            <div className="flex flex-wrap justify-center gap-2 mt-2">
                                <Badge className={cn("px-3 py-1 gap-1.5 shadow-none border", levelColors[config.chunkingLevel])}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Optimizado: {levelLabels[config.chunkingLevel]}
                                </Badge>
                                {config.maskPii && (
                                    <Badge variant="outline" className="px-3 py-1 gap-1.5 bg-white text-slate-600 border-slate-200 shadow-none">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Privacidad Activa
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Area removed - Handled by the modal footer button to avoid redundancy */}

            {isUploading && (
                <div className="py-6 flex flex-col items-center justify-center gap-4 animate-pulse">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <div className="text-center space-y-1">
                        <p className="text-sm font-bold text-slate-900">Analizando documento...</p>
                        <p className="text-xs text-slate-500">Esto puede tardar hasta 60 segundos dependiendo del tamaño.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
