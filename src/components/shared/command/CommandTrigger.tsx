"use client";

import React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface CommandTriggerProps {
    onOpen: () => void;
}

/**
 * CommandTrigger — ERA 14 Refactor
 * The button that appears in the nav or header to trigger the Command Palette.
 */
export function CommandTrigger({ onOpen }: CommandTriggerProps) {
    const t = useTranslations("common");

    return (
        <button
            onClick={onOpen}
            data-tour="global-search"
            className="hidden lg:flex items-center gap-2 px-3 py-2 min-w-[300px] text-sm text-slate-500 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700/50 rounded-xl hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all group shadow-sm"
        >
            <Search size={16} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
            <span className="flex-1 text-left font-medium text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                {t("navigation.items.search")}...
            </span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-bold text-slate-500 opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <span className="text-xs">⌘</span>K
            </kbd>
        </button>
    );
}
