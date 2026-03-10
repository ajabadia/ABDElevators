'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PromptFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    tenantFilter: string;
    setTenantFilter: (val: string) => void;
    categoryFilter: string;
    setCategoryFilter: (val: string) => void;
    industryFilter: string;
    setIndustryFilter: (val: string) => void;
    uniqueTenants: { id: string, name: string }[];
    promptsCount: number;
    categoryCounts: Record<string, number>;
    categories: string[];
}

/**
 * 🔍 PromptFilters Component
 * SRP: Responsable únicamente de la UI y el estado de filtrado de prompts.
 */
export function PromptFilters({
    searchQuery,
    setSearchQuery,
    tenantFilter,
    setTenantFilter,
    categoryFilter,
    setCategoryFilter,
    industryFilter,
    setIndustryFilter,
    uniqueTenants,
    promptsCount,
    categoryCounts,
    categories
}: PromptFiltersProps) {
    const t = useTranslations('admin_prompts');

    const clearFilters = () => {
        setSearchQuery('');
        setTenantFilter('all');
        setCategoryFilter('all');
        setIndustryFilter('all');
    };

    const isFiltered = searchQuery || tenantFilter !== 'all' || categoryFilter !== 'all' || industryFilter !== 'all';

    return (
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        placeholder={t('search_placeholder')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs py-2 pl-9 h-11 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                    />
                </div>
                {isFiltered && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearFilters}
                        className="rounded-xl text-slate-400 hover:text-rose-500"
                        title={t('actions.clear_filters')}
                        aria-label={t('actions.clear_filters')}
                    >
                        <X size={18} />
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
                <button
                    onClick={() => setCategoryFilter('all')}
                    className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border",
                        categoryFilter === 'all'
                            ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-teal-500/50"
                    )}
                >
                    {t('filters.all')} ({promptsCount})
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2",
                            categoryFilter === cat
                                ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20"
                                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-teal-500/50"
                        )}
                    >
                        {cat}
                        <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[9px]",
                            categoryFilter === cat ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                            {categoryCounts[cat] || 0}
                        </span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
                {uniqueTenants.length > 1 && (
                    <select
                        value={tenantFilter}
                        onChange={e => setTenantFilter(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider h-10 px-3 focus:border-teal-500 outline-none"
                        aria-label={t('filters.organization')}
                    >
                        <option value="all">{t('filters.organization')}</option>
                        {uniqueTenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                )}
                <select
                    value={industryFilter}
                    onChange={e => setIndustryFilter(e.target.value)}
                    className="w-full bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-800 rounded-xl text-[10px] font-bold uppercase tracking-wider h-10 px-3 focus:border-teal-500 outline-none text-teal-700 dark:text-teal-400"
                    aria-label={t('industries.all')}
                >
                    <option value="all">{t('industries.all')}</option>
                    <option value="GENERIC">{t('industries.GENERIC')}</option>
                    <option value="ELEVATORS">{t('industries.ELEVATORS')}</option>
                    <option value="LEGAL">{t('industries.LEGAL')}</option>
                    <option value="BANKING">{t('industries.BANKING')}</option>
                    <option value="INSURANCE">{t('industries.INSURANCE')}</option>
                    <option value="IT">{t('industries.IT')}</option>
                    <option value="MEDICAL">{t('industries.MEDICAL')}</option>
                </select>
            </div>
        </div>
    );
}
