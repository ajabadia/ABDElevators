"use client";

import { useUXStore } from "@/store/ux-store";
import { Info } from "lucide-react";

interface ContextualHelpProps {
    title?: string;
    description: string;
    className?: string;
}

/**
 * Renders small helpful text blocks if the global Help Mode is enabled.
 * Helps reduce friction for novice/infrequent users without cluttering the UI for experts.
 */
export function ContextualHelp({ title, description, className = "" }: ContextualHelpProps) {
    const { helpMode } = useUXStore();

    if (!helpMode) return null;

    return (
        <div className={`flex items-start gap-3 p-3 mb-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 animate-in fade-in slide-in-from-top-1 duration-300 ${className}`}>
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" />
            <div className="space-y-1">
                {title && <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{title}</p>}
                <p className="text-xs leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
