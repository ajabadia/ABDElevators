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
    const [answer, setAnswer] = React.useState("");

    const context = userContext || 'inspection';
    const suggestions = CONTEXT_DEFAULTS[context as WorkContext].defaultQuestions;

    const handleAsk = async () => {
        if (!question.trim()) return;
        setIsAsking(true);
        setAnswer("");
        try {
            const response = await fetch("/api/technical/rag/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: question,
                    stream: false
                })
            });

            if (!response.ok) throw new Error("Error en la respuesta del RAG");

            const data = await response.json();

            if (data.answer) {
                setAnswer(data.answer);
            } else {
                setAnswer("He analizado los documentos pero no encontré una respuesta específica.");
            }

            toast.success("Respuesta generada con éxito");
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar consulta");
        } finally {
            setIsAsking(false);
        }
    };

    return (
        <div className="space-y-6">
            {!answer ? (
                <>
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
                        {isAsking ? "Analizando documentos reales..." : "Preguntar a la IA RAG"}
                    </Button>
                </>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                            <Sparkles size={14} />
                            Respuesta Inteligente
                        </div>
                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
                            <React.Suspense fallback={<div className="h-4 w-4 animate-spin" />}>
                                {answer}
                            </React.Suspense>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-2xl font-bold"
                            onClick={() => setAnswer("")}
                        >
                            Preguntar otra cosa
                        </Button>
                        <Button
                            className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
                            onClick={nextStep}
                        >
                            Continuar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

