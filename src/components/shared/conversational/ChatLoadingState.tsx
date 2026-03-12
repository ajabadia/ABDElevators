"use client";

import React from "react";
import { Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslations } from "next-intl";

interface ChatLoadingStateProps {
    streamingContent: string;
    retryCount: number;
    maxRetries: number;
}

/**
 * ChatLoadingState — ERA 14 Refactor
 * Renders the loading indicator or the content while streaming.
 */
export function ChatLoadingState({
    streamingContent,
    retryCount,
    maxRetries
}: ChatLoadingStateProps) {
    const t = useTranslations("common.navigation.search");

    return (
        <div className="flex items-start gap-4 mr-auto max-w-3xl w-full">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white mt-1">
                <Bot size={16} />
            </div>
            <div className="p-5 rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm w-full">
                {streamingContent ? (
                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown>{streamingContent}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                                {retryCount > 0
                                    ? `${t("analyzing")} (${retryCount}/${maxRetries})`
                                    : t("analyzing")}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
