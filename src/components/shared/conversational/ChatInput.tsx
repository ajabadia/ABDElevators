"use client";

import React from "react";
import { Send, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: (e?: React.FormEvent) => void;
    isLoading: boolean;
    inputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * ChatInput — ERA 14 Refactor
 * Handles the user input and send button with loading state.
 */
export function ChatInput({
    value,
    onChange,
    onSend,
    isLoading,
    inputRef
}: ChatInputProps) {
    const t = useTranslations("common.navigation.search");

    return (
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 backdrop-blur-sm">
            <form onSubmit={onSend} className="relative flex items-center gap-2 max-w-4xl mx-auto group">
                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={t("placeholder")}
                        className="w-full pl-5 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-semibold shadow-sm outline-none"
                        disabled={isLoading}
                        autoFocus
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange("")}
                                className="p-1.5 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                aria-label={t("clear_input")}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
                <Button
                    type="submit"
                    disabled={isLoading || !value.trim()}
                    className="h-[52px] w-[52px] rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 shrink-0 text-white p-0"
                    aria-label={isLoading ? t("analyzing") : t("send_query")}
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={20} />}
                </Button>
            </form>
            <div className="text-center mt-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                    {t("disclaimer")}
                </p>
            </div>
        </div>
    );
}
