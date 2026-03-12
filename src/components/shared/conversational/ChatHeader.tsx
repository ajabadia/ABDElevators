"use client";

import React from "react";
import { Bot } from "lucide-react";
import { useTranslations } from "next-intl";

interface ChatHeaderProps {
    hideHeader?: boolean;
}

/**
 * ChatHeader — ERA 14 Refactor
 * Renders the top bar of the conversational search.
 */
export function ChatHeader({ hideHeader }: ChatHeaderProps) {
    const t = useTranslations("common.navigation.search");

    if (hideHeader) return null;

    return (
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 text-white">
                <Bot className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-foreground leading-none mb-1">{t("title")}</h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t("subtitle")}
                </p>
            </div>
        </div>
    );
}
