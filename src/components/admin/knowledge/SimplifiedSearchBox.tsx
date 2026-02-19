"use client";

import { Search, Sparkles, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface SimplifiedSearchBoxProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: () => void;
    activeFiltersCount?: number;
    onToggleAdvanced: () => void;
    isAdvancedOpen: boolean;
    className?: string;
}

/**
 * SimplifiedSearchBox - ERA 6 UI Improvement
 * A clean, powerful search interface that defaults to semantic discovery.
 */
export function SimplifiedSearchBox({
    value,
    onChange,
    onSearch,
    activeFiltersCount = 0,
    onToggleAdvanced,
    isAdvancedOpen,
    className
}: SimplifiedSearchBoxProps) {
    const t = useTranslations("admin.knowledge");

    return (
        <div className={cn("w-full space-y-4", className)}>
            <div className="relative group transition-all duration-300">
                {/* Search Bar Container */}
                <div className={cn(
                    "flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 shadow-sm",
                    "focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/50",
                    isAdvancedOpen ? "border-primary/30 shadow-md" : "border-slate-200"
                )}>
                    {/* Prefix Icon */}
                    <div className="pl-3 text-slate-400 group-focus-within:text-primary transition-colors">
                        <Search className="w-5 h-5" />
                    </div>

                    {/* Main Input */}
                    <Input
                        type="text"
                        placeholder="Busca en tus documentos (ej: 'especificaciones motor schindler')"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSearch()}
                        className="flex-1 bg-transparent border-none text-lg focus-visible:ring-0 placeholder:text-slate-400 h-10"
                    />

                    {/* Semantic Indicator */}
                    <Badge variant="secondary" className="hidden md:flex gap-1.5 py-1 px-3 bg-blue-50 text-blue-600 border-blue-100 font-bold items-center select-none shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        Búsqueda Semántica
                    </Badge>

                    {/* Advanced Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleAdvanced}
                        className={cn(
                            "rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest transition-colors",
                            isAdvancedOpen
                                ? "bg-primary/5 text-primary"
                                : "text-slate-500 hover:bg-slate-100"
                        )}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtros</span>
                        {activeFiltersCount > 0 && (
                            <span className="flex items-center justify-center w-4 h-4 bg-primary text-white rounded-full text-[9px] -mr-1">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>

                    {/* Search Button */}
                    <Button
                        onClick={onSearch}
                        className="rounded-xl px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-transform active:scale-95"
                    >
                        Buscar
                    </Button>
                </div>
            </div>

            {/* Hint / Active Summary */}
            {!isAdvancedOpen && activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 px-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filtros Activos:</span>
                    <div className="flex gap-1.5">
                        {/* This could be mapped from actual active filter labels */}
                        <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-500 border-slate-200 px-2 py-0">
                            Personalizados ({activeFiltersCount})
                        </Badge>
                    </div>
                </div>
            )}
        </div>
    );
}
