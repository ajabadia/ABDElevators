"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    FileText,
    X,
    Sparkles,
    ShieldCheck,
    Loader2,
    Send,
    MessageSquare,
    Settings2,
    ChevronRight,
    ExternalLink,
    AlertTriangle,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SmartConfig } from "@/hooks/useSmartConfig";
import { humanizeConfidence, confidencePercent } from "@/lib/confidence-humanizer";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { ErrorMapperService } from "@/services/core/ErrorMapperService";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

/** Step in the Simple Analyze flow */
export type AnalyzeStep = 'upload' | 'question' | 'result';

/** Source chunk from RAG response */
interface SourceChunk {
    text: string;
    source: string;
    score?: number;
    approxPage?: number;
    cloudinaryUrl?: string;
}

/** Result from the RAG analysis */
export interface AnalyzeResult {
    answer: string;
    confidence: number;
    sources: SourceChunk[];
}

interface SimpleAnalyzeViewProps {
    file: File | null;
    onDrop: (files: File[]) => void;
    config: SmartConfig;
    isUploading: boolean;
    onUpload: () => void;
    onReset: () => void;
    className?: string;
    /** Optional: pre-set step (controlled) */
    initialStep?: AnalyzeStep;
    /** Optional: callback when analysis result is available */
    onResult?: (result: AnalyzeResult) => void;
    /** Optional: render advanced config UI inside Expert Mode */
    expertModeContent?: React.ReactNode;
}

// ────────────────────────────────────────────────
// Contextual question suggestions by document type
// ────────────────────────────────────────────────

const QUESTION_SUGGESTIONS: Record<string, string[]> = {
    normativa: [
        "¿Cuáles son los requisitos de seguridad principales?",
        "¿Qué normativas aplican a este tipo de equipo?",
        "Resume las obligaciones del titular",
    ],
    manual_tecnico: [
        "¿Cómo realizar el procedimiento de mantenimiento?",
        "¿Cuáles son los códigos de error más comunes?",
        "¿Qué herramientas son necesarias?",
    ],
    pedido: [
        "¿Cuáles son los modelos detectados?",
        "¿Hay requisitos especiales en este pedido?",
        "Resume las especificaciones técnicas",
    ],
    generico: [
        "Resume los puntos principales del documento",
        "¿Qué conclusiones se pueden extraer?",
        "¿Cuáles son los datos más relevantes?",
    ],
};

/**
 * SimpleAnalyzeView — ERA 6 Core Flow (FASE 192)
 *
 * 3-step wizard: Upload → Question → Result
 * Hides technical complexity behind smart defaults.
 * Expert Mode toggle reveals advanced RAG configuration.
 */
export function SimpleAnalyzeView({
    file,
    onDrop,
    config,
    isUploading,
    onUpload,
    onReset,
    className,
    initialStep = 'upload',
    onResult,
    expertModeContent,
}: SimpleAnalyzeViewProps) {
    const t = useTranslations("common");

    // Step state machine
    const [step, setStep] = useState<AnalyzeStep>(initialStep);
    const [question, setQuestion] = useState('');
    const [isQuerying, setIsQuerying] = useState(false);
    const [result, setResult] = useState<AnalyzeResult | null>(null);
    const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const { toast } = useToast();

    // Load dynamic suggestions (Phase 216.3)
    useEffect(() => {
        if (!file) return;

        const loadSuggestions = async () => {
            setIsLoadingSuggestions(true);
            try {
                // We use the same endpoint as QuickAnalyzeModal but with filename search if needed
                // For now, if we don't have an ID, we might need to skip or use a search endpoint
                // Assuming we can find the asset by filename if it was already ingested
                const res = await fetch(`/api/admin/knowledge-assets?search=${file.name}&limit=1`);
                const data = await res.json();
                if (data.success && data.assets?.[0]) {
                    const assetId = data.assets[0]._id;
                    const surgRes = await fetch(`/api/admin/knowledge-assets/${assetId}/suggest-questions`);
                    const surgData = await surgRes.json();
                    if (surgData.success && surgData.suggestions) {
                        setDynamicSuggestions(surgData.suggestions);
                    }
                }
            } catch (error) {
                console.error("Failed to load suggestions:", error);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        loadSuggestions();
    }, [file?.name]);
    const [lastError, setLastError] = useState<{ message: string; details?: string } | null>(null);

    // Calculate dynamic ETA (FASE 217.4)
    const calculateETA = () => {
        if (!file) return null;

        const sizeMB = file.size / (1024 * 1024);
        // Base speeds in MB/s
        const speeds: Record<string, number> = {
            bajo: 2.0,
            medio: 1.0,
            alto: 0.5
        };

        const speed = speeds[config.chunkingLevel] || 1.0;
        const baseSeconds = 3; // Overhead/init
        const estimatedSeconds = Math.round((sizeMB / speed) + baseSeconds);

        if (estimatedSeconds < 60) return `${estimatedSeconds}s`;
        const mins = Math.floor(estimatedSeconds / 60);
        const secs = estimatedSeconds % 60;
        return `${mins}m ${secs}s`;
    };

    const eta = calculateETA();

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (accepted) => {
            onDrop(accepted);
            // Auto-advance to question step after file selection
            if (accepted.length > 0) {
                setTimeout(() => setStep('question'), 400);
            }
        },
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        disabled: isUploading || !!file || step !== 'upload',
    });

    const levelLabels: Record<string, string> = {
        bajo: "Básico",
        medio: "Semántico (Recomendado)",
        alto: "IA Avanzada (Deep Analysis)",
    };

    const levelColors: Record<string, string> = {
        bajo: "bg-blue-100 text-blue-700 border-blue-200",
        medio: "bg-emerald-100 text-emerald-700 border-emerald-200",
        alto: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };

    // Detect doc type from file name for suggestion matching
    const detectDocType = (): string => {
        if (!file) return 'generico';
        const name = file.name.toLowerCase();
        if (['normativa', 'norma', 'reglamento', 'ley', 'decreto'].some(k => name.includes(k))) return 'normativa';
        if (['manual', 'guia', 'instrucciones', 'procedimiento'].some(k => name.includes(k))) return 'manual_tecnico';
        if (['pedido', 'orden', 'solicitud', 'oferta'].some(k => name.includes(k))) return 'pedido';
        return 'generico';
    };

    const suggestions = dynamicSuggestions.length > 0
        ? dynamicSuggestions
        : (QUESTION_SUGGESTIONS[detectDocType()] || QUESTION_SUGGESTIONS.generico);

    /** Submit question to RAG API */
    const handleAsk = async () => {
        if (!question.trim() || !file) return;

        setIsQuerying(true);
        try {
            // First: upload/ingest
            onUpload();

            // Then: query RAG with the question
            const res = await fetch('/api/technical/rag/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: question,
                    filename: file.name,
                    context_only: true // For quick analysis
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error?.message || 'Query failed');
            }

            const data = await res.json();

            const analysisResult: AnalyzeResult = {
                answer: data.answer || data.response || '',
                confidence: data.confidence ?? data.score ?? 0.75,
                sources: (data.sources || data.documents || []).map((s: SourceChunk) => ({
                    text: s.text,
                    source: s.source,
                    score: s.score,
                    approxPage: s.approxPage,
                    cloudinaryUrl: s.cloudinaryUrl,
                })),
            };

            setResult(analysisResult);
            setStep('result');
            onResult?.(analysisResult);

            toast({
                title: t('analyzeFlow.resultTitle'),
                description: "Análisis completado con éxito.",
            });
        } catch (error: any) {
            console.error('[ANALYZE_ERROR]', error);
            const mapped = ErrorMapperService.fromError(error);
            setLastError({
                message: mapped.message,
                details: mapped.action
            });
            toast({
                variant: "destructive",
                title: mapped.title,
                description: mapped.message,
            });
        } finally {
            setIsQuerying(false);
        }
    };

    /** Reset the entire flow */
    const handleFullReset = () => {
        setStep('upload');
        setQuestion('');
        setResult(null);
        onReset();
    };

    return (
        <div className={cn("space-y-6", className)}>

            {/* ──────── STEP 1: Upload ──────── */}
            {step === 'upload' && (
                <div
                    {...getRootProps()}
                    className={cn(
                        "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 min-h-[240px] flex flex-col items-center justify-center gap-4 cursor-pointer",
                        isDragActive
                            ? "border-primary bg-primary/5 scale-[0.99] shadow-inner"
                            : "border-slate-200 hover:border-primary/50 hover:bg-slate-50",
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-primary animate-in fade-in zoom-in duration-500">
                        <Upload className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xl font-bold text-slate-900 tracking-tight">
                            Arrastra tu documento o haz click para seleccionar
                        </p>
                        <p className="text-sm text-slate-500">
                            PDF • Máx. 250MB
                        </p>
                    </div>
                </div>
            )}

            {/* ──────── STEP 2: Question ──────── */}
            {step === 'question' && file && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
                    {/* File preview mini */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-lg border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500 font-mono">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <Badge className={cn("px-2 py-0.5 gap-1 shadow-none border text-xs", levelColors[config.chunkingLevel])}>
                            <Sparkles className="w-3 h-3" />
                            {levelLabels[config.chunkingLevel]}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-destructive"
                            onClick={handleFullReset}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Question input */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            {t("analyzeFlow.askQuestion")}
                        </label>
                        <Textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ej: ¿Cuáles son los requisitos de seguridad?"
                            rows={3}
                            className="resize-none border-slate-200 focus:ring-primary"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAsk();
                                }
                            }}
                        />
                    </div>

                    {/* Contextual suggestions */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {t("analyzeFlow.suggestionsLabel")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {isLoadingSuggestions ? (
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <Loader2 size={10} className="animate-spin" />
                                    {t("expertMode.generatingSuggestions")}
                                </div>
                            ) : (
                                suggestions.map((suggestion, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setQuestion(suggestion)}
                                        className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-primary/10 hover:text-primary border border-slate-200 rounded-full transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Error display */}
                    {lastError && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-2 text-red-700 text-xs font-bold mb-1">
                                <AlertTriangle size={14} />
                                {lastError.message}
                            </div>
                            {lastError.details && (
                                <p className="text-[10px] text-red-500 italic ml-6">
                                    {lastError.details}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Expert Mode Toggle */}
                    {expertModeContent && (
                        <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2">
                                <Settings2 size={14} />
                                {t("expertMode.toggle")}
                                <span className="text-xs opacity-60">({t("expertMode.subtitle")})</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-3 border-t border-slate-100 mt-2">
                                {expertModeContent}
                            </CollapsibleContent>
                        </Collapsible>
                    )}

                    {/* Submit */}
                    <Button
                        onClick={handleAsk}
                        disabled={!question.trim() || isQuerying}
                        className="w-full h-12 text-base font-bold shadow-lg"
                    >
                        {isQuerying ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {t("analyzeFlow.analyzing")}
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />
                                Analizar
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* ──────── STEP 3: Result ──────── */}
            {step === 'result' && result && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
                    {/* Answer card */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 space-y-4">
                            {/* Confidence badge */}
                            {(() => {
                                const conf = humanizeConfidence(result.confidence);
                                return (
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 shadow-none">
                                            <Sparkles size={12} />
                                            {t("analyzeFlow.resultTitle")}
                                        </Badge>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-sm font-bold", conf.colorClass)}>
                                                {conf.icon} {t(conf.labelKey)}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                ({confidencePercent(result.confidence)}%)
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* AI answer */}
                            <div className="prose prose-slate prose-sm max-w-none">
                                <ReactMarkdown>{result.answer}</ReactMarkdown>
                            </div>

                            {/* Confidence message */}
                            {(() => {
                                const conf = humanizeConfidence(result.confidence);
                                return (
                                    <p className={cn("text-xs italic", conf.colorClass)}>
                                        {t(conf.messageKey)}
                                    </p>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Sources */}
                    {result.sources.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                                <ShieldCheck size={14} className="text-primary" />
                                {t("analyzeFlow.sourcesLabel")} ({result.sources.length})
                            </p>
                            <div className="grid gap-2">
                                {result.sources.map((source, i) => (
                                    <SourceCard key={i} source={source} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStep('question');
                                setResult(null);
                            }}
                            className="flex-1"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Hacer otra pregunta
                        </Button>
                        <Button variant="outline" onClick={handleFullReset}>
                            <Upload className="w-4 h-4 mr-2" />
                            Nuevo documento
                        </Button>
                    </div>
                </div>
            )}

            {/* Loading state (during upload/ingest) */}
            {isUploading && step !== 'result' && (
                <div className="py-6 flex flex-col items-center justify-center gap-4 animate-pulse">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <div className="text-center space-y-1">
                        <p className="text-sm font-bold text-slate-900">{t("analyzeFlow.analyzing")}</p>
                        <p className="text-xs text-slate-500">{t("analyzeFlow.analyzeWait")}</p>
                        {eta && (
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-2 animate-pulse">
                                Tiempo estimado: {eta}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────
// Source Card sub-component
// ────────────────────────────────────────────────

function SourceCard({ source }: { source: SourceChunk }) {
    const [expanded, setExpanded] = useState(false);
    const t = useTranslations("common");
    const conf = source.score != null ? humanizeConfidence(source.score) : null;

    return (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">
                        {source.source}
                    </span>
                    {source.approxPage && (
                        <span className="text-[10px] text-slate-400">• Pág {source.approxPage}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {conf && (
                        <span className={cn("text-[10px] font-bold", conf.colorClass)}>
                            {conf.icon} {confidencePercent(source.score!)}%
                        </span>
                    )}
                    {source.cloudinaryUrl && (
                        <a
                            href={source.cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:scale-110 transition-transform"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                </div>
            </div>

            {/* Text fragment with expand */}
            <p className={cn("text-xs text-slate-600 italic leading-relaxed", !expanded && "line-clamp-2")}>
                &ldquo;{source.text}&rdquo;
            </p>
            {source.text.length > 150 && (
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1"
                >
                    <ChevronRight size={10} className={cn("transition-transform", expanded && "rotate-90")} />
                    {expanded ? "Colapsar" : t("expertMode.moreContext")}
                </button>
            )}
        </div>
    );
}
