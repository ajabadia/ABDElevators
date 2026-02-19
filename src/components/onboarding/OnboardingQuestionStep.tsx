"use client";

import React from "react";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOnboardingContext } from "@/components/onboarding-provider";
import { CONTEXT_DEFAULTS, WorkContext } from "@/lib/work-context";
import { toast } from "sonner";

export function OnboardingQuestionStep() {
    const { nextStep, userContext } = useOnboardingContext();
    const [question, setQuestion] = React.useState("");
    const [isAsking, setIsAsking] = React.useState(false);

    const context = userContext || 'inspection';
    const suggestions = CONTEXT_DEFAULTS[context as WorkContext].defaultQuestions;

    const handleAsk = async () => {
        if (!question.trim()) return;
        setIsAsking(true);
        try {
            // Simulated RAG query
            await new Promise(resolve => setTimeout(resolve, 2500));
            toast.success("Respuesta generada con éxito");
            nextStep();
        } catch (error) {
            toast.error("Error al procesar consulta");
        } finally {
            setIsAsking(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <MessageSquare size={14} className="text-primary" />
                    Tu primera consulta
                </label>
                <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ej: ¿Qué dice la norma sobre el foso?"
                    rows={3}
                    className="resize-none rounded-2xl border-border focus:ring-primary bg-secondary/10"
                />
            </div>

            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Sugerencias para tu rol
                </p>
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setQuestion(suggestion)}
                            className="text-[11px] px-3 py-1.5 bg-secondary/20 hover:bg-primary/10 hover:text-primary rounded-full border border-transparent hover:border-primary/20 transition-all text-left"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>

            <Button
                className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
                onClick={handleAsk}
                disabled={!question.trim() || isAsking}
            >
                {isAsking ? (
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                ) : (
                    <Send className="mr-2 h-4 w-4" />
                )}
                {isAsking ? "Analizando documento..." : "Preguntar a la IA"}
            </Button>
        </div>
    );
}
