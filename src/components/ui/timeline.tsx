"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { Clock, Activity, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface TimelineItem {
    id: string;
    title: string;
    description?: string;
    timestamp: string | Date;
    icon?: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

interface TimelineProps {
    items: TimelineItem[];
    className?: string;
    loading?: boolean;
}

export function Timeline({ items, className, loading }: TimelineProps) {
    const t = useTranslations('components.Timeline');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400 animate-pulse">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">{t('loading')}</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                <Activity className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">{t('empty')}</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6 relative pl-4 border-l border-slate-200 dark:border-slate-800 ml-3", className)}>
            {items.map((item) => (
                <div key={item.id} className="relative group">
                    {/* Dot Indicator */}
                    <div className={cn(
                        "absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 shadow-sm",
                        getVariantClasses(item.variant)
                    )} />

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {item.icon && <span className="w-4 h-4 opacity-70">{item.icon}</span>}
                                {item.title}
                            </h4>
                            <time className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                                {format(new Date(item.timestamp), "d MMM, HH:mm", { locale: es })}
                            </time>
                        </div>
                        {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800/50 mt-1">
                                {item.description}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function getVariantClasses(variant?: TimelineItem['variant']) {
    switch (variant) {
        case 'success': return "bg-emerald-500";
        case 'warning': return "bg-amber-500";
        case 'error': return "bg-rose-500";
        case 'info': return "bg-indigo-500";
        default: return "bg-slate-400";
    }
}
