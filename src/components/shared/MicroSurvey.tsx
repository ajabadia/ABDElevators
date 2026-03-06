"use client";

import { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, X, Send } from "lucide-react";
import { toast } from "sonner";
import type { UxSurveyInput } from "@/lib/schemas/feedback";

type SurveyContext = UxSurveyInput["context"];

interface MicroSurveyProps {
    /**
     * Where this survey is triggered from (maps to UxSurveySchema.context).
     * Controls the question text displayed.
     */
    context: SurveyContext;
    /**
     * Called when the user dismisses or completes the survey.
     * The parent should use this to hide the survey after it fires.
     */
    onDismiss: () => void;
    className?: string;
}

const QUESTION_MAP: Record<SurveyContext, string> = {
    admin_console: "¿Te resultó fácil encontrar lo que buscabas aquí?",
    ingest_complete: "¿El proceso de carga fue claro y sencillo?",
    rag_query: "¿La respuesta de la IA resolvió tu pregunta?",
    workflow_complete: "¿El flujo de trabajo fue fácil de usar?",
};

/**
 * A lightweight thumbs up/down micro-survey widget.
 * Renders as an unobtrusive inline card that auto-dismisses after submission.
 *
 * @example
 * const [showSurvey, setShowSurvey] = useState(true);
 * {showSurvey && <MicroSurvey context="ingest_complete" onDismiss={() => setShowSurvey(false)} />}
 */
export function MicroSurvey({ context, onDismiss, className = "" }: MicroSurveyProps) {
    const [sentiment, setSentiment] = useState<"positive" | "negative" | null>(null);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const question = QUESTION_MAP[context];

    const handleSentiment = useCallback((value: "positive" | "negative") => {
        setSentiment(prev => (prev === value ? null : value));
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!sentiment) return;
        setSubmitting(true);
        try {
            const payload: UxSurveyInput = {
                context,
                sentiment,
                ...(comment.trim() ? { comment: comment.trim() } : {}),
            };
            const res = await fetch("/api/feedback/ux-survey", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Survey API error");
            toast.success("¡Gracias por tu opinión! Nos ayuda a mejorar.");
            onDismiss();
        } catch {
            toast.error("No se pudo enviar la encuesta. Inténtalo de nuevo.");
        } finally {
            setSubmitting(false);
        }
    }, [sentiment, comment, context, onDismiss]);

    return (
        <div
            className={`relative flex flex-col gap-3 p-4 rounded-2xl border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}
            role="region"
            aria-label="Encuesta de satisfacción"
        >
            {/* Dismiss */}
            <button
                onClick={onDismiss}
                aria-label="Cerrar encuesta"
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>

            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 pr-6 leading-snug">
                {question}
            </p>

            {/* Thumbs */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handleSentiment("positive")}
                    aria-pressed={sentiment === "positive"}
                    aria-label="Sí, fue sencillo"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${sentiment === "positive"
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-inner"
                            : "border-border hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-600 dark:text-slate-400"
                        }`}
                >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Sí
                </button>
                <button
                    onClick={() => handleSentiment("negative")}
                    aria-pressed={sentiment === "negative"}
                    aria-label="No, fue difícil"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${sentiment === "negative"
                            ? "bg-rose-500 text-white border-rose-500 shadow-inner"
                            : "border-border hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-600 dark:text-slate-400"
                        }`}
                >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    No
                </button>
            </div>

            {/* Optional comment — softly visible after selection */}
            {sentiment && (
                <div className="animate-in fade-in duration-200 space-y-2">
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="¿Algo que podamos mejorar? (opcional)"
                        maxLength={500}
                        rows={2}
                        className="w-full text-xs rounded-xl border border-border bg-background px-3 py-2 resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                        aria-label="Comentario opcional"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                        <Send className="w-3 h-3" />
                        {submitting ? "Enviando..." : "Enviar"}
                    </button>
                </div>
            )}
        </div>
    );
}
