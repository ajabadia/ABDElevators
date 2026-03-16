"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CorrelationIdService } from "@/services/observability/CorrelationIdService";

export interface Message {
    id?: string;
    role: "user" | "assistant";
    content: string;
    documents?: any[];
    trace?: string[];
    isSelfHealed?: boolean;
    hallucinationScore?: number;
}

interface UseConversationalSearchProps {
    filename?: string;
}

/**
 * useConversationalSearch — ERA 14 Refactor
 * Encapsulates the logic for the conversational search interface.
 * Handles streaming RAG queries, message state, and retries.
 */
export function useConversationalSearch({ filename }: UseConversationalSearchProps = {}) {
    const t = useTranslations("common.navigation.search");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [currentDocs, setCurrentDocs] = useState<any[]>([]);
    const [currentTrace, setCurrentTrace] = useState<string[]>([]);
    const [previewAsset, setPreviewAsset] = useState<{ id: string; filename: string; page?: number } | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 2;

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent, scrollToBottom]);

    const handleSendMessage = async (e?: React.FormEvent, overrideInput?: string, isRetry = false) => {
        if (e) e.preventDefault();

        const textToSend = overrideInput || input;
        if (!textToSend.trim() || (isLoading && !isRetry)) return;

        if (!isRetry) {
            const userMessage: Message = { role: "user", content: textToSend };
            setMessages(prev => [...prev, userMessage]);
            setInput("");
        }

        setIsLoading(true);
        setStreamingContent("");
        setCurrentDocs([]);
        setCurrentTrace([]);

        const performFetch = async (attempt: number): Promise<boolean> => {
            try {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                const response = await fetch(`${baseUrl}/api/technical/rag/chat`, {
                    method: "POST",
                    cache: "no-store",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messages: isRetry ? messages : [...messages, { role: "user", content: textToSend }],
                        stream: true,
                        filename: filename
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let fullAssistantContent = "";
                let metadata: { isSelfHealed: boolean; hallucinationScore: number } = { isSelfHealed: false, hallucinationScore: 0 };

                if (!reader) return false;

                let isDone = false;
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        isDone = true;
                        break;
                    }

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (!line || !line.startsWith('data: ')) continue;
                        const jsonStr = line.replace('data: ', '');
                        if (jsonStr === '[DONE]') {
                            isDone = true;
                            break;
                        }

                        try {
                            const event = JSON.parse(jsonStr);
                            if (event.type === 'token') {
                                fullAssistantContent += event.data;
                                setStreamingContent(fullAssistantContent);
                            } else if (event.type === 'docs') {
                                setCurrentDocs(event.data);
                            } else if (event.type === 'trace') {
                                setCurrentTrace(event.data);
                            } else if (event.type === 'connected' && event.data.status === 'complete') {
                                if (event.data.metadata) {
                                    metadata = event.data.metadata;
                                }
                            }
                        } catch (e) {
                            // Silent fail for incomplete chunks
                        }
                    }
                }

                if (isDone || fullAssistantContent.length > 0) {
                    setMessages(prev => [...prev, {
                        id: CorrelationIdService.generate(),
                        role: "assistant",
                        content: fullAssistantContent,
                        documents: currentDocs,
                        trace: currentTrace,
                        isSelfHealed: metadata.isSelfHealed,
                        hallucinationScore: metadata.hallucinationScore
                    }]);
                    setStreamingContent("");
                    setRetryCount(0);
                    return true;
                }
                return false;
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error);
                return false;
            }
        };

        let success = await performFetch(1);

        if (!success) {
            for (let i = 1; i <= MAX_RETRIES; i++) {
                setRetryCount(i);
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                success = await performFetch(i + 1);
                if (success) break;
            }
        }

        if (!success) {
            toast.error(t("error_connection"));
            setMessages(prev => [...prev, {
                id: CorrelationIdService.generate(),
                role: "assistant",
                content: "error_retry"
            }]);
        }

        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const clearMessages = () => setMessages([]);

    return {
        messages,
        setMessages,
        input,
        setInput,
        isLoading,
        streamingContent,
        previewAsset,
        setPreviewAsset,
        retryCount,
        MAX_RETRIES,
        messagesEndRef,
        inputRef,
        handleSendMessage,
        clearMessages,
        scrollToBottom
    };
}
