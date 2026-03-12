"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
    confidence?: number;
    timestamp: Date;
}

interface UseQuickAnalyzeProps {
    assetId?: string;
    filename?: string;
    open: boolean;
}

/**
 * useQuickAnalyze hook — ERA 14 Refactor
 * Encapsulates the state and streaming logic for the QuickAnalyzeModal.
 */
export function useQuickAnalyze({ assetId, filename, open }: UseQuickAnalyzeProps) {
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

    // Load suggestions
    useEffect(() => {
        if (!assetId || !open) return;

        const loadSuggestions = async () => {
            setIsLoadingSuggestions(true);
            try {
                const res = await fetch(`/api/admin/knowledge-assets/${assetId}/suggest-questions`);
                const data = await res.json();
                if (data.success && data.suggestions) {
                    setDynamicSuggestions(data.suggestions);
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
    }, [assetId, open, t, tCommon]);

    const handleAsk = async (overrideQuestion?: string) => {
        const q = overrideQuestion || question;
        if (!q.trim() || isQuerying) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: q,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
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
                    question: q,
                    filename,
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    stream: true
                }),
            });

            if (!res.ok) throw new Error('Query failed');

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let assistantText = "";
            let sources: any[] = [];

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
                                setStatus("");
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
                                const lastTrace = data.data?.[data.data.length - 1];
                                if (lastTrace) {
                                    if (lastTrace.includes('RETRIEVAL')) setStatus(t('analyze_modal.status.retrieving'));
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
                            // Incomplete chunks
                        }
                    }
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
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

    return {
        question,
        setQuestion,
        isQuerying,
        messages,
        setMessages,
        status,
        traces,
        showTraces,
        setShowTraces,
        dynamicSuggestions,
        isLoadingSuggestions,
        handleAsk
    };
}
