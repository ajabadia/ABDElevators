"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CommandItem as CommandItemType } from "@/hooks/useCommandMenu";

interface CommandItemProps {
    item: CommandItemType;
    isSelected: boolean;
    onSelect: () => void;
    onMouseEnter: () => void;
}

/**
 * CommandItem — ERA 14 Refactor
 * Individual command item in the list.
 */
export function CommandItem({
    item,
    isSelected,
    onSelect,
    onMouseEnter
}: CommandItemProps) {
    return (
        <div
            onClick={onSelect}
            onMouseEnter={onMouseEnter}
            className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer bg-white dark:bg-slate-900 border transition-all group",
                isSelected
                    ? "border-teal-500 shadow-md ring-2 ring-teal-500/10"
                    : "border-slate-100 dark:border-slate-800 hover:border-teal-500/50"
            )}
        >
            <div className={cn(
                "p-2.5 rounded-lg transition-colors",
                isSelected
                    ? "bg-teal-50 dark:bg-teal-900/40 text-teal-600"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 group-hover:text-teal-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20"
            )}>
                <item.icon size={18} />
            </div>
            <span className={cn(
                "text-sm font-bold transition-colors",
                isSelected
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
            )}>
                {item.name}
            </span>
        </div>
    );
}
