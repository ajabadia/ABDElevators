"use client";

import React from "react";
import { Search, Activity, Shield, Hash } from "lucide-react";
import { ContentCard } from "@/components/ui/content-card";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

interface AuditFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    levelFilter: string;
    setLevelFilter: (val: string) => void;
    sourceFilter: string;
    setSourceFilter: (val: string) => void;
    logStats: any;
    levels: string[];
    sources: string[];
}

/**
 * 🛠️ AuditFilters (Uncodixify 3.0)
 * Refined controls for high-density observability.
 */
export function AuditFilters({
    searchQuery,
    setSearchQuery,
    levelFilter,
    setLevelFilter,
    sourceFilter,
    setSourceFilter,
    logStats,
    levels,
    sources
}: AuditFiltersProps) {
    const t = useTranslations("admin_logs"); // Using same namespace as client

    return (
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
            {/* Ultra-refined Search */}
            <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                    placeholder="Filtrar eventos, correlaciones o trazas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:ring-1 focus:ring-primary/20 transition-all text-xs font-medium"
                />
            </div>

            {/* Level Select (Mini Pills) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setLevelFilter('')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${!levelFilter ? 'bg-white dark:bg-slate-900 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    ALL
                </button>
                {levels.map(lvl => (
                    <button
                        key={lvl}
                        onClick={() => setLevelFilter(lvl === levelFilter ? '' : lvl)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black tracking-tight transition-all flex items-center gap-1.5 ${levelFilter === lvl 
                            ? (lvl === 'ERROR' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900') 
                            : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {lvl}
                    </button>
                ))}
            </div>

            {/* Source Pill (Dropdown mock or scrollable horizontal) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="px-2 text-[9px] font-black text-slate-400 border-r border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    SRC
                </div>
                <div className="flex items-center gap-1 max-w-[200px] overflow-x-auto no-scrollbar">
                    {sources.map(src => (
                        <button
                            key={src}
                            onClick={() => setSourceFilter(src === sourceFilter ? '' : src)}
                            className={`whitespace-now80 px-2.5 py-1.5 rounded-md text-[9px] font-bold transition-all ${sourceFilter === src 
                                ? 'bg-blue-600 text-white' 
                                : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {src}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
