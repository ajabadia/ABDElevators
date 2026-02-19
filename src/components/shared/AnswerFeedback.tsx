"use client";

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Check, Send, Loader2 } from "lucide-react";
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
    className?: string;
}

type FeedbackStep = 'vote' | 'thanks' | 'negative_form';

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
    className
}: AnswerFeedbackProps) {
    const t = useTranslations("feedback");
    const [step, setStep] = useState<FeedbackStep>('vote');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [comment, setComment] = useState("");

    const categories = [
        { id: 'incorrect', label: t('categories.incorrect') },
        { id: 'incomplete', label: t('categories.incomplete') },
        { id: 'irrelevant', label: t('categories.irrelevant') },
        { id: 'source_wrong', label: t('categories.source_wrong') },
    ];

    const handleSubmit = async (type: 'thumbs_up' | 'thumbs_down', finalParams?: any) => {
        setIsSubmitting(true);
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
                        className="flex items-center gap-2 text-sm text-primary font-medium"
                    >
                        <Check className="h-4 w-4" />
                        {t('thanks_positive')}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
