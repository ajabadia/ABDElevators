"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export function SandboxChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "¡Hola! Soy el asistente virtual de la Demo. Pregúntame sobre los documentos de ejemplo (Manual Otis Gen2 o Contrato Torre Norte)."
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/sandbox/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    previousMessages: messages.slice(1).map(m => ({ role: m.role, content: m.content }))
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429) throw new Error("Has excedido el límite de la demo. Intenta más tarde.");
                throw new Error("Error en el servicio de demo.");
            }

            const aiMessage: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: data.response };
            setMessages(prev => [...prev, aiMessage]);
        } catch (err: any) {
            setError(err.message || "Algo salió mal");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="flex flex-col h-[500px] md:h-[600px] border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-teal-600 rounded-lg text-white shadow-lg shadow-teal-600/20">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">RAG Demo</h3>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Online • Gemini Flash
                        </p>
                    </div>
                </div>
                <div className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded font-mono text-slate-500">
                    Public Mode
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={cn(
                                "flex gap-3",
                                m.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            {m.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                                    <Bot size={16} className="text-teal-600 dark:text-teal-400" />
                                </div>
                            )}

                            <div
                                className={cn(
                                    "max-w-[85%] rounded-2xl p-3 text-sm shadow-sm",
                                    m.role === "user"
                                        ? "bg-teal-600 text-white rounded-tr-none"
                                        : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none"
                                )}
                            >
                                <div className="prose dark:prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>
                                        {m.content}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {m.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                    <User size={16} className="text-slate-600 dark:text-slate-400" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                                <Bot size={16} className="text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none p-3 shadow-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex gap-2 justify-center items-center p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 text-xs text-center mx-8">
                            <AlertTriangle size={14} />
                            {error}
                        </div>
                    )}

                    <div ref={scrollRef as any} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 rounded-b-xl">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pregunta algo sobre el Otis Gen2..."
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
                    >
                        <Send size={18} />
                    </Button>
                </form>
                <div className="mt-2 text-[10px] text-center text-slate-400">
                    A.B.D. RAG Sandbox • Documents are fictional/demo purposes only.
                </div>
            </div>
        </Card>
    );
}
