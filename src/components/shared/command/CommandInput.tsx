"use client";

import React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface CommandInputProps {
    value: string;
    onChange: (value: string) => void;
}

/**
 * CommandInput — ERA 14 Refactor
 * The search input field inside the Command Palette dialog.
 */
export function CommandInput({ value, onChange }: CommandInputProps) {
    const t = useTranslations("common");

    return (
        <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4 bg-slate-50/50 dark:bg-slate-900/50">
            <Search className="mr-3 h-5 w-5 shrink-0 opacity-50 text-teal-600" />
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t("navigation.items.search").concat("...")}
                className="flex h-16 w-full bg-transparent py-3 text-lg outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 text-slate-800 dark:text-slate-100 font-medium"
                autoFocus
            />
        </div>
    );
}
