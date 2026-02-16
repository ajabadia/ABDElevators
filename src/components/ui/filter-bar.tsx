"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type FilterType = 'search' | 'select' | 'date-range' | 'boolean';

export interface FilterConfig {
    id: string;
    type: FilterType;
    label: string;
    placeholder?: string;
    options?: { label: string; value: string }[]; // For select type
}

interface FilterBarProps {
    config: FilterConfig[];
    onFilterChange: (filters: Record<string, any>) => void;
    className?: string;
}

export function FilterBar({ config, onFilterChange, className }: FilterBarProps) {
    const t = useTranslations('components.FilterBar');
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        // Debounce actual filter update could be handled here or in useEffect
        updateFilters({ ...activeFilters, search: e.target.value });
    };

    const updateFilters = (newFilters: Record<string, any>) => {
        // Clean undefined/empty values
        const cleanFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== "" && value !== null) {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>);

        setActiveFilters(cleanFilters);
        onFilterChange(cleanFilters);
    };

    const removeFilter = (key: string) => {
        const newFilters = { ...activeFilters };
        delete newFilters[key];
        if (key === 'search') setSearchQuery("");
        updateFilters(newFilters);
    };

    const clearAll = () => {
        setSearchQuery("");
        updateFilters({});
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Search is always prominent if present in config */}
                {config.some(c => c.type === 'search') && (
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder={config.find(c => c.type === 'search')?.placeholder || t('search_placeholder')}
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="pl-9 w-full bg-white dark:bg-slate-950"
                        />
                    </div>
                )}

                {/* Other Filters in a Popover or Inline depending on complexity */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto border-dashed">
                            <Filter className="w-4 h-4 mr-2" />
                            {t('filter_by')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                        <div className="space-y-4">
                            <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">Filtros Avanzados</h4>
                            {config.filter(c => c.type !== 'search').map((c) => (
                                <div key={c.id} className="space-y-2">
                                    <label className="text-xs font-medium text-slate-500">{c.label}</label>

                                    {c.type === 'select' && (
                                        <Select
                                            value={activeFilters[c.id]}
                                            onValueChange={(val) => updateFilters({ ...activeFilters, [c.id]: val })}
                                        >
                                            <SelectTrigger className="w-full h-8 text-xs">
                                                <SelectValue placeholder={c.placeholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {c.options?.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {/* Date Range simplified for demo */}
                                    {c.type === 'date-range' && (
                                        <Button variant="outline" className="w-full justify-start text-left font-normal h-8 text-xs">
                                            <CalendarIcon className="mr-2 h-3 w-3" />
                                            {t('date_range')}
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <div className="pt-2 flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7">
                                    {t('reset')}
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Active Filter Chips */}
            {Object.keys(activeFilters).length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-slate-500 mr-1">Activos:</span>
                    {Object.entries(activeFilters).map(([key, value]) => {
                        const conf = config.find(c => c.id === key);
                        if (!conf) return null;

                        let label = value;
                        if (conf.type === 'select') {
                            label = conf.options?.find(o => o.value === value)?.label || value;
                        }

                        return (
                            <Badge key={key} variant="secondary" className="pl-2 pr-1 py-0.5 gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                                <span className="font-normal text-indigo-400 mr-0.5">{conf.label}:</span>
                                {String(label)}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-3 w-3 p-0 ml-1 hover:bg-indigo-200 rounded-full"
                                    onClick={() => removeFilter(key)}
                                >
                                    <X className="w-2 h-2" />
                                </Button>
                            </Badge>
                        );
                    })}
                    <Button variant="ghost" size="sm" onClick={clearAll} className="text-[10px] h-5 px-2 text-slate-400 hover:text-rose-500">
                        {t('reset')}
                    </Button>
                </div>
            )}
        </div>
    );
}
