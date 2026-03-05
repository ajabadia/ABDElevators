"use client";

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Check, Send, Loader2, BrainCircuit, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AnswerFeedbackProps {
    answerId: string;
    question: string;
    documentSource: string;
    docId?: string; // New: Reference to the source document for re-processing
    className?: string;
}

type FeedbackStep = 'vote' | 'thanks' | 'negative_form' | 'healing' | 'healing_done';

/**
 * AnswerFeedback Widget — FASE 195.2
 * 
 * Progressive feedback collector for RAG answers.
 * States: Vote (thumbs) -> Thanks (positive) OR Form (negative) -> Thanks.
 */
export default function AnswerFeedback({
    answerId,
    question,
    documentSource,
    docId,
    className
}: AnswerFeedbackProps) {
    const t = useTranslations("feedback");
    const [step, setStep] = useState<FeedbackStep>('vote');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [comment, setComment] = useState("");
    const [voteType, setVoteType] = useState<'thumbs_up' | 'thumbs_down' | null>(null);

    const categories = [
        { id: 'incorrect', label: t('categories.incorrect') },
        { id: 'incomplete', label: t('categories.incomplete') },
        { id: 'irrelevant', label: t('categories.irrelevant') },
        { id: 'source_wrong', label: t('categories.source_wrong') },
    ];

    const handleSubmit = async (type: 'thumbs_up' | 'thumbs_down', finalParams?: any) => {
        setIsSubmitting(true);
        setVoteType(type);
        try {
            const response = await fetch('/api/feedback/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answerId,
                    type,
                    question,
                    documentSource,
                    ...finalParams
                })
            });

            if (!response.ok) throw new Error('Failed to submit feedback');

            if (type === 'thumbs_up') {
                setStep('thanks');
                toast.success(t('thanks_positive'));
                // Auto-reset or hide after some time if needed
            } else if (finalParams) {
                setStep('thanks');
                toast.success(t('thanks_negative'));
            } else {
                setStep('negative_form');
            }
        } catch (error) {
            console.error(error);
            toast.error("Error submitting feedback");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelfHealing = async () => {
        if (!docId) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/admin/ingest/reprocess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ docId, options: { enableVision: true } })
            });

            if (!response.ok) throw new Error('Healing trigger failed');

            setStep('healing_done');
            toast.success(t('healing_success', { defaultValue: "Iniciado auto-reparación. La IA está re-analizando con alta precisión." }));
        } catch (error) {
            console.error(error);
            toast.error(t('healing_error', { defaultValue: "No se pudo iniciar la auto-reparación" }));
            setStep('thanks');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleCategory = (id: string) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleNegativeSubmit = () => {
        handleSubmit('thumbs_down', {
            categories: selectedCategories,
            expectedAnswer: comment
        });
    };

    return (
        <div className={cn("mt-4 pt-4 border-t border-border/50", className)}>
            <AnimatePresence mode="wait">
                {step === 'vote' && (
                    <motion.div
                        key="vote"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-4"
                    >
                        <span className="text-sm text-muted-foreground font-medium">
                            {t('question')}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors border-border/50"
                                onClick={() => handleSubmit('thumbs_up')}
                                disabled={isSubmitting}
                            >
                                <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors border-border/50"
                                onClick={() => setStep('negative_form')}
                                disabled={isSubmitting}
                            >
                                <ThumbsDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 'negative_form' && (
                    <motion.div
                        key="negative"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 overflow-hidden"
                    >
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat.id)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                                        selectedCategories.includes(cat.id)
                                            ? "bg-primary/20 border-primary text-primary"
                                            : "bg-muted border-transparent text-muted-foreground hover:bg-muted/80"
                                    )}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <Textarea
                            placeholder={t('placeholder')}
                            className="text-sm min-h-[80px] bg-background/50 border-border/50 focus-visible:ring-primary/30"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />

                        <div className="flex justify-end gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setStep('vote')}
                                className="text-xs h-8"
                            >
                                {t('cancel', { defaultValue: 'Cancelar' })}
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleNegativeSubmit}
                                disabled={isSubmitting || (selectedCategories.length === 0 && !comment)}
                                className="text-xs h-8 gap-2"
                            >
                                {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                {t('submit')}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 'thanks' && (
                    <motion.div
                        key="thanks"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-3"
                    >
                        <div className="flex items-center gap-2 text-sm text-primary font-medium">
                            <Check className="h-4 w-4" />
                            {voteType === 'thumbs_up' ? t('thanks_positive') : t('thanks_negative')}
                        </div>

                        {voteType === 'thumbs_down' && docId && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSelfHealing}
                                className="w-fit text-xs gap-2 border-primary/30 text-primary hover:bg-primary/5"
                                disabled={isSubmitting}
                            >
                                <BrainCircuit className="h-3.5 w-3.5" />
                                {t('fix_answer', { defaultValue: "Reparar esta respuesta (Auto-Healing)" })}
                            </Button>
                        )}
                    </motion.div>
                )}

                {(step === 'healing' || step === 'healing_done') && (
                    <motion.div
                        key="healing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 text-sm font-medium"
                    >
                        {step === 'healing' ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span className="text-muted-foreground">{t('healing_in_progress', { defaultValue: "Iniciando protocolos de reparación..." })}</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                                <span className="text-primary">{t('healing_initiated', { defaultValue: "Protocolo activo. El pulso del sistema mostrará el progreso." })}</span>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
