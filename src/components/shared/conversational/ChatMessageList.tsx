"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { Message } from "@/hooks/useConversationalSearch";
import { ChatMessage } from "./ChatMessage";
import { ChatWelcome } from "./ChatWelcome";
import { ChatLoadingState } from "./ChatLoadingState";

interface ChatMessageListProps {
    messages: Message[];
    isLoading: boolean;
    streamingContent: string;
    retryCount: number;
    maxRetries: number;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onQuerySelect: (query: string) => void;
    onRetry: (index: number) => void;
    onPreview: (id: string, filename: string, page?: number) => void;
}

/**
 * ChatMessageList — ERA 14 Refactor
 * Orquestas the list of messages, welcome screen, and loading states.
 */
export function ChatMessageList({
    messages,
    isLoading,
    streamingContent,
    retryCount,
    maxRetries,
    messagesEndRef,
    onQuerySelect,
    onRetry,
    onPreview
}: ChatMessageListProps) {
    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <AnimatePresence initial={false}>
                {messages.length === 0 && (
                    <ChatWelcome onQuerySelect={onQuerySelect} />
                )}

                {messages.map((m, i) => (
                    <ChatMessage
                        key={i}
                        message={m}
                        index={i}
                        onRetry={() => onRetry(i)}
                        onPreview={onPreview}
                    />
                ))}

                {isLoading && (
                    <ChatLoadingState 
                        streamingContent={streamingContent}
                        retryCount={retryCount}
                        maxRetries={maxRetries}
                    />
                )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
        </div>
    );
}
