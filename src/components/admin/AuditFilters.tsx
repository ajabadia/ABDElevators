"use client";

import React from "react";
import { Search, Activity } from "lucide-react";
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
    const t = useTranslations("admin.audit.filters");

    return (
        <div className="space-y-4 mb-6">
            <ContentCard className="p-2 border-slate-200 dark:border-slate-800 shadow-sm" noPadding>
                <div className="flex items-center px-4 py-2 gap-4">
                    <Search className="w-5 h-5 text-slate-300" />
                    <Input
                        placeholder={t("search_placeholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-none shadow-none focus-visible:ring-0 text-sm font-medium p-0 h-10 placeholder:text-slate-400"
                    />
                </div>
            </ContentCard>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={() => {
                        setLevelFilter('__ALL__');
                        setSourceFilter('');
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${levelFilter === '__ALL__'
                        ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20"
                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-teal-500/50"
                        }`}
                >
                    <Activity className="w-3 h-3" />
                    {t("all")} ({logStats?.total || 0})
                </button>

                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />

                {levels.map(lvl => (
                    <button
                        key={lvl}
                        onClick={() => setLevelFilter(lvl)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2 ${levelFilter === lvl
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400"
                            }`}
                    >
                        {lvl}
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${levelFilter === lvl ? "bg-white/20 text-white dark:bg-slate-200 dark:text-slate-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}>
                            {logStats?.levels?.[lvl] || 0}
                        </span>
                    </button>
                ))}

                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />

                {sources.map(src => (
                    <button
                        key={src}
                        onClick={() => setSourceFilter(src)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2 ${sourceFilter === src
                            ? "bg-blue-600 border-blue-600 text-white shadow-md"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-500/50"
                            }`}
                    >
                        {src.toUpperCase()}
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${sourceFilter === src ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}>
                            {logStats?.sources?.[src] || 0}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
