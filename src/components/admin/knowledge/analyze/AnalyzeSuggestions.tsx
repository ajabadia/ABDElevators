"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface AnalyzeSuggestionsProps {
    suggestions: string[];
    isLoading: boolean;
    onSelect: (suggestion: string) => void;
    disabled?: boolean;
}

export function AnalyzeSuggestions({ suggestions, isLoading, onSelect, disabled }: AnalyzeSuggestionsProps) {
    const t = useTranslations("knowledge_hub");

    if (!isLoading && suggestions.length === 0) return null;

    return (
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-black/20 flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 mr-2">
                <Sparkles size={12} className="text-teal-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {t('analyze_modal.suggestions.label')}
                </span>
            </div>
            
            {isLoading ? (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 py-1">
                    <Loader2 size={10} className="animate-spin" />
                    {t('analyze_modal.suggestions.loading')}
                </div>
            ) : (
                suggestions.map((s, i) => (
                    <Badge 
                        key={i} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-teal-500 hover:text-white transition-colors py-1 px-3 rounded-full text-[11px] font-bold border-none"
                        onClick={() => !disabled && onSelect(s)}
                    >
                        {s}
                    </Badge>
                ))
            )}
        </div>
    );
}
