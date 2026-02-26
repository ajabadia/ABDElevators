"use client";

import { useState, useRef, useEffect } from "react";
import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Sparkles,
    MessageSquare,
    Loader2,
    Send,
    ShieldCheck,
    FileText,
    History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { KnowledgeAsset } from "@/types/knowledge";
import { humanizeConfidence, confidencePercent } from "@/lib/confidence-humanizer";

interface QuickAnalyzeModalProps {
    asset: KnowledgeAsset | null;
    open: boolean;
    onClose: () => void;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
    confidence?: number;
    timestamp: Date;
}

/**
 * QuickAnalyzeModal — ERA 6 Vision (FASE 204)
 * Allows direct chat with an existing document using scoped RAG.
 */
export function QuickAnalyzeModal({ asset, open, onClose }: QuickAnalyzeModalProps) {
    const t = useTranslations("knowledge_hub");
    const tCommon = useTranslations("common");

    const [question, setQuestion] = useState("");
    const [isQuerying, setIsQuerying] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [status, setStatus] = useState<string>("");
    const [traces, setTraces] = useState<string[]>([]);
    const [showTraces, setShowTraces] = useState(false);
    const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const traceScrollRef = React.useRef<HTMLDivElement>(null);

    // Load dynamic suggestions (Phase 216.3)
    useEffect(() => {
        if (!asset || !open) return;

        const loadSuggestions = async () => {
            setIsLoadingSuggestions(true);
            try {
                const res = await fetch(`/api/admin/knowledge-assets/${asset._id}/suggest-questions`);
                const data = await res.json();
                if (data.success && data.suggestions) {
                    setDynamicSuggestions(data.suggestions);
                    toast.success(t('analyze_modal.title'), {
                        description: t('analyze_modal.toasts.suggestions_loaded'),
                    });
                }
            } catch (error) {
                console.error("Failed to load suggestions:", error);
                toast.error(tCommon("error"), {
                    description: t('analyze_modal.errors.suggestions_failed'),
                });
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        loadSuggestions();
    }, [asset?._id, open]);

    // Auto-scroll to bottom on new messages
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isQuerying]);

    // Auto-scroll to bottom on new traces
    React.useEffect(() => {
        if (traceScrollRef.current) {
            traceScrollRef.current.scrollTop = traceScrollRef.current.scrollHeight;
        }
    }, [traces]);

    if (!asset) return null;

    const handleAsk = async () => {
        if (!question.trim() || isQuerying) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: question,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        const currentQuestion = question;
        setQuestion("");
        setIsQuerying(true);
        setStatus(t('analyze_modal.status.starting'));
        setTraces([t('analyze_modal.traces.request_sent')]);
        setShowTraces(true);
        try {
            const res = await fetch('/api/technical/rag/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQuestion,
                    filename: asset.filename,
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    stream: true
                }),
            });

            if (!res.ok) throw new Error('Query failed');

            // Handle Streaming Response
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let assistantText = "";
            let sources: any[] = [];

            // Create a temporary message to update as tokens arrive
            const initialAssistantMsg: ChatMessage = {
                role: 'assistant',
                content: "",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, initialAssistantMsg]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                        try {
                            const data = JSON.parse(trimmedLine.substring(6));

                            if (data.type === 'connected') {
                                setStatus(t('analyze_modal.status.connected'));
                            } else if (data.type === 'token') {
                                setStatus(""); // Clear status when generation starts
                                assistantText += data.data;
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    const last = newMsgs[newMsgs.length - 1];
                                    if (last && last.role === 'assistant') {
                                        last.content = assistantText;
                                    }
                                    return newMsgs;
                                });
                            } else if (data.type === 'docs') {
                                setStatus(t('analyze_modal.status.analyzing_chunks', { count: data.data.length }));
                                sources = data.data;
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    const last = newMsgs[newMsgs.length - 1];
                                    if (last && last.role === 'assistant') {
                                        last.sources = sources;
                                    }
                                    return newMsgs;
                                });
                            } else if (data.type === 'trace') {
                                setTraces(prev => [...prev, ...data.data]);
                                // Update status based on trace contents
                                const lastTrace = data.data?.[data.data.length - 1];
                                if (lastTrace) {
                                    if (lastTrace.includes('RETRIEVAL') || lastTrace.includes('NODO_ACTIVO: Procesando RETRIEVE')) setStatus(t('analyze_modal.status.retrieving'));
                                    if (lastTrace.includes('GRADING')) setStatus(t('analyze_modal.status.grading'));
                                    if (lastTrace.includes('VERIFICATION')) setStatus(t('analyze_modal.status.verifying'));
                                    if (lastTrace.includes('RE-WRITE')) setStatus(t('analyze_modal.status.rewriting'));
                                    if (lastTrace.includes('GENERACIÓN')) setStatus(t('analyze_modal.status.generating'));
                                }
                            } else if (data.type === 'error') {
                                throw new Error(data.data.message || "Error en el agente");
                            } else if (data.type === 'confidence') {
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    const last = newMsgs[newMsgs.length - 1];
                                    if (last && last.role === 'assistant') {
                                        last.confidence = data.data;
                                    }
                                    return newMsgs;
                                });
                            }
                        } catch (e) {
                            // Ignorar fragmentos incompletos
                        }
                    }
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Error in quick analysis:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: t('analyze_modal.errors.generic'),
                timestamp: new Date()
            }]);
            toast.error(t('analyze_modal.errors.title'), {
                description: errorMessage || t('analyze_modal.errors.unexpected'),
            });
        } finally {
            setIsQuerying(false);
            setStatus("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                {/* Header */}
                <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-primary">
                            <Sparkles className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-xl font-bold text-slate-900 truncate">
                                {t('analyze_modal.title')}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-0.5">
                                <FileText size={14} className="text-slate-400" />
                                <span className="truncate max-w-[400px]">{asset.filename}</span>
                                <Badge variant="outline" className="text-[10px] py-0 px-1 bg-white">
                                    {asset.usage === 'TRANSACTIONAL' ? 'Transactional' : 'Reference'}
                                </Badge>
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMessages([])}
                                title={t('analyze_modal.actions.reset')}
                                className="text-slate-400 hover:text-primary transition-colors"
                            >
                                <History size={18} />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Chat Area */}
                <ScrollArea className="flex-1 p-6 bg-white">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.length === 0 ? (
                            <div className="h-[40vh] flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                    <MessageSquare size={32} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-bold text-slate-800">{t('analyze_modal.chat.welcome_title')}</p>
                                    <p className="text-sm text-slate-500 max-w-sm">
                                        {t('analyze_modal.chat.welcome_desc')}
                                    </p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2 pt-4">
                                    {isLoadingSuggestions ? (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Loader2 size={12} className="animate-spin" />
                                            {t('analyze_modal.status.generating_suggestions')}
                                        </div>
                                    ) : (
                                        (dynamicSuggestions.length > 0 ? dynamicSuggestions : [
                                            t('analyze_modal.suggestions.default_1'),
                                            t('analyze_modal.suggestions.default_2'),
                                            t('analyze_modal.suggestions.default_3'),
                                            t('analyze_modal.suggestions.default_4')
                                        ]).map((s, i) => (
                                            <Button
                                                key={i}
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full text-xs hover:bg-primary/5 hover:text-primary transition-all"
                                                onClick={() => setQuestion(s)}
                                            >
                                                {s}
                                            </Button>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={cn(
                                    "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}>
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white",
                                        msg.role === 'user' ? "bg-slate-400" : "bg-primary shadow-sm"
                                    )}>
                                        {msg.role === 'user' ? <History size={16} /> : <Sparkles size={16} />}
                                    </div>
                                    <div className={cn(
                                        "flex flex-col gap-2 max-w-[85%]",
                                        msg.role === 'user' ? "items-end" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                                            msg.role === 'user'
                                                ? "bg-slate-900 text-white rounded-tr-none"
                                                : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none"
                                        )}>
                                            <div className="prose prose-slate prose-sm max-w-none dark:prose-invert">
                                                <ReactMarkdown>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>

                                        {msg.role === 'assistant' && msg.confidence && (
                                            <div className="flex items-center gap-2 px-1">
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase",
                                                    humanizeConfidence(msg.confidence).colorClass
                                                )}>
                                                    {t('analyze_modal.chat.confidence')}: {confidencePercent(msg.confidence)}%
                                                </span>
                                            </div>
                                        )}

                                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-100 flex gap-1">
                                                    <ShieldCheck size={10} /> {t('analyze_modal.chat.verified_sources', { count: msg.sources.length })}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {isQuerying && (
                            <div className="flex justify-start">
                                <div className="flex flex-col gap-3 w-full max-w-[90%]">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse ml-12">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                        <span className="ml-2 italic font-medium">{status || t('analyze_modal.status.thinking')}</span>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                            <Sparkles size={16} />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="bg-slate-50 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-100 h-10 flex items-center w-fit">
                                                <div className="flex gap-1">
                                                    <div className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                                    <div className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                    <div className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                                </div>
                                            </div>

                                            {/* Thought Console */}
                                            {showTraces && traces.length > 0 && (
                                                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-lg animate-in fade-in zoom-in-95 duration-300">
                                                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border-b border-white/5">
                                                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Loader2 size={10} className="animate-spin" /> {t('analyze_modal.traces.title')}
                                                        </span>
                                                        <button
                                                            onClick={() => setShowTraces(!showTraces)}
                                                            className="text-[10px] text-slate-500 hover:text-white transition-colors"
                                                        >
                                                            {showTraces ? t('analyze_modal.traces.hide') : t('analyze_modal.traces.show')}
                                                        </button>
                                                    </div>
                                                    <div
                                                        ref={traceScrollRef}
                                                        className="p-3 max-h-[150px] overflow-y-auto font-mono text-[11px] leading-relaxed text-emerald-400/90"
                                                    >
                                                        {traces.map((t, i) => (
                                                            <div key={i} className="mb-1 flex gap-2">
                                                                <span className="text-slate-600 shrink-0 select-none">[{i + 1}]</span>
                                                                <span>{t}</span>
                                                            </div>
                                                        ))}
                                                        <div className="w-2 h-4 bg-emerald-400/50 animate-pulse inline-block align-middle ml-1" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} className="h-0" />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                    <div className="max-w-3xl mx-auto flex gap-3">
                        <div className="relative flex-1">
                            <Textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder={t('analyze_modal.chat.input_placeholder')}
                                className="min-h-[50px] max-h-[150px] pr-12 py-3 rounded-xl border-slate-200 focus:ring-primary shadow-sm resize-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAsk();
                                    }
                                }}
                            />
                            <Button
                                size="icon"
                                className="absolute right-2 bottom-2 h-8 w-8 rounded-lg shadow-md"
                                onClick={handleAsk}
                                disabled={!question.trim() || isQuerying}
                            >
                                <Send size={16} />
                            </Button>
                        </div>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        {t('analyze_modal.chat.footer_note')}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
