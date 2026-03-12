"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Bot, RefreshCw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Message } from "@/hooks/useConversationalSearch";
import { SourceChip } from "./SourceChip";
import AnswerFeedback from "@/components/shared/AnswerFeedback";

interface ChatMessageProps {
    message: Message;
    index: number;
    onRetry: () => void;
    onPreview: (id: string, filename: string, page?: number) => void;
}

/**
 * ChatMessage — ERA 14 Refactor
 * Individual message component for user or assistant.
 * Handles markdown rendering, sources, feedback, and retry logic.
 */
export function ChatMessage({ message, index, onRetry, onPreview }: ChatMessageProps) {
    const t = useTranslations("common.navigation.search");
    const tExpert = useTranslations("common.expertMode");

    const isUser = message.role === "user";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex items-start gap-4 max-w-3xl w-full",
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
        >
            {/* Avatar */}
            <div className={cn(
                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border mt-1",
                isUser
                    ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                    : "bg-primary border-primary text-white"
            )}>
                {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Bubble */}
            <div className={cn(
                "p-5 rounded-2xl text-[14px] leading-relaxed shadow-sm",
                isUser
                    ? "bg-primary text-white rounded-tr-none font-medium"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none text-slate-700 dark:text-slate-200"
            )}>
                {isUser ? (
                    <p>{message.content}</p>
                ) : message.content === "error_retry" ? (
                    <div className="space-y-3">
                        <p className="text-destructive font-bold text-xs uppercase tracking-wider">
                            {t("error_message")}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            className="h-9 px-4 gap-2 border-destructive/20 hover:bg-destructive/5 text-destructive font-bold"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {t("retry_action") || "Reintentar"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Status Metadata (Self-Healing) - Phase 254 */}
                        {message.isSelfHealed && (
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 font-black text-[10px] uppercase tracking-wider animate-in fade-in slide-in-from-left-2">
                                    {tExpert("selfHealed")}
                                </Badge>
                                {message.hallucinationScore !== undefined && (
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        Hallucination Score: {message.hallucinationScore.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>

                        {/* Sources section */}
                        {message.documents && message.documents.length > 0 && (
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 text-primary" /> {t("sources_label")}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {message.documents.map((doc, idx) => (
                                        <SourceChip
                                            key={idx}
                                            doc={doc}
                                            onPreview={onPreview}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Feedback Loop */}
                        <AnswerFeedback
                            answerId={message.id || `msg-${index}`}
                            question={message.content} // This might need the previous message's content if we want the actual question
                            documentSource={message.documents?.[0]?.source || "Knowledge Base"}
                            chunkIds={message.documents?.map((d: any) => d.id || d._id || d.chunkId).filter(Boolean)}
                            className="border-t-0 p-0 mt-2"
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
}
