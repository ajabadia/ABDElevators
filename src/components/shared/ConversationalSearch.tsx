"use client";

import React from "react";
import { PDFPreviewModal } from "@/components/admin/knowledge/PDFPreviewModal";
import { useConversationalSearch } from "@/hooks/useConversationalSearch";

// Modular Components
import { ChatHeader } from "./conversational/ChatHeader";
import { ChatMessageList } from "./conversational/ChatMessageList";
import { ChatInput } from "./conversational/ChatInput";

/**
 * ConversationalSearch — ERA 14 Refactor
 * 
 * Full chat interface for technical documentation.
 * Refactored into a hook (useConversationalSearch) and modular sub-components.
 * Follows SRP and improves maintainability.
 */
export function ConversationalSearch({ filename, hideHeader = false }: { filename?: string, hideHeader?: boolean }) {
    
    const {
        messages,
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
        handleSendMessage
    } = useConversationalSearch({ filename });

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-[75vh] relative bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <ChatHeader hideHeader={hideHeader} />

            <ChatMessageList 
                messages={messages}
                isLoading={isLoading}
                streamingContent={streamingContent}
                retryCount={retryCount}
                maxRetries={MAX_RETRIES}
                messagesEndRef={messagesEndRef}
                onQuerySelect={(query) => handleSendMessage(undefined, query)}
                onRetry={(index) => handleSendMessage(undefined, messages[index - 1]?.content, true)}
                onPreview={(id, filename, page) => setPreviewAsset({ id, filename, page })}
            />

            <ChatInput 
                value={input}
                onChange={setInput}
                onSend={(e) => handleSendMessage(e)}
                isLoading={isLoading}
                inputRef={inputRef}
            />

            <PDFPreviewModal
                isOpen={!!previewAsset}
                onClose={() => setPreviewAsset(null)}
                id={previewAsset?.id || ""}
                filename={previewAsset?.filename || ""}
                initialPage={previewAsset?.page}
            />
        </div>
    );
}
