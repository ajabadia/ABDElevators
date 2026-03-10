"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
    X,
    Send,
    Bot,
    User,
    Sparkles,
    ChevronRight,
    BrainCircuit,
    Maximize2,
    Minimize2,
    Search
} from "lucide-react";
import { useSidekickStore } from "@/store/sidekick-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * ContextualSidekick - ERA 10: CLARITY
 * A persistent AI helper that understands the current page context.
 */
export function ContextualSidekick() {
    const { isOpen, setOpen, messages, addMessage, currentContext, contextMetadata } = useSidekickStore();
    const pathname = usePathname();
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isSpecificContext, setIsSpecificContext] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-40 p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 transition-all group border border-white/20"
                aria-label="Open AI Sidekick"
            >
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full animate-pulse border-2 border-slate-900" />
                <Bot size={24} className="group-hover:rotate-12 transition-transform" />
            </button>
        );
    }

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;

        const userMsg = input.trim();
        setInput("");
        addMessage({ role: 'user', content: userMsg });

        setIsThinking(true);

        try {
            const res = await fetch('/api/core/sidekick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    pathname: pathname || '/',
                    contextData: contextMetadata,
                    history: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!res.ok) throw new Error('Falló comunicación con el Sidekick Neural.');

            const data = await res.json();

            setIsSpecificContext(data.isSpecificContext);
            addMessage({
                role: 'assistant',
                content: data.response
            });
        } catch (error) {
            console.error("Sidekick Error:", error);
            setIsSpecificContext(false);
            addMessage({
                role: 'assistant',
                content: "Disculpa, he perdido mi conexión neuronal. Intenta de nuevo más tarde."
            });
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                        <BrainCircuit size={20} className="text-teal-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black tracking-widest uppercase">AI Sidekick</h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                isSpecificContext ? "bg-green-400" : "bg-teal-400"
                            )} />
                            <span className={isSpecificContext ? "text-green-400" : "text-teal-400"}>
                                {isSpecificContext ? "CONTEXT AWARE" : "ANALYZING CONTEXT"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 rounded-lg">
                        <Minimize2 size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(false)}
                        className="h-8 w-8 text-white hover:bg-rose-500 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </Button>
                </div>
            </div>

            {/* Context Badge */}
            {currentContext && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-hidden">
                    <Search size={12} className="text-slate-400" />
                    <span className="text-[10px] font-mono whitespace-nowrap text-slate-500">CONTEXT: {currentContext}</span>
                </div>
            )}

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn(
                            "flex gap-3",
                            msg.role === 'user' ? "flex-row-reverse" : ""
                        )}>
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                msg.role === 'assistant' ? "bg-teal-500/10 text-teal-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            )}>
                                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                            </div>
                            <div className={cn(
                                "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                                msg.role === 'assistant'
                                    ? "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
                                    : "bg-teal-600 text-white font-medium"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex gap-1">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <div className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Pregunta algo sobre el contexto actual..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking}
                        className="absolute right-2 top-2 p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1 hover:text-teal-500 cursor-pointer transition-colors">
                        <Sparkles size={12} />
                        Documentación
                    </div>
                    <div className="flex items-center gap-1 hover:text-teal-500 cursor-pointer transition-colors">
                        <ChevronRight size={12} />
                        Sugerencias IA
                    </div>
                </div>
            </div>
        </div>
    );
}
