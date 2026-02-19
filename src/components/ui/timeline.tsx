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
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground animate-pulse">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">{t('loading')}</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border">
                <Activity className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">{t('empty')}</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6 relative pl-4 border-l border-border ml-3", className)}>
            {items.map((item) => (
                <div key={item.id} className="relative group">
                    {/* Dot Indicator */}
                    <div className={cn(
                        "absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-background shadow-sm",
                        getVariantClasses(item.variant)
                    )} />

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                {item.icon && <span className="w-4 h-4 opacity-70">{item.icon}</span>}
                                {item.title}
                            </h4>
                            <time className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                                {format(new Date(item.timestamp), "d MMM, HH:mm", { locale: es })}
                            </time>
                        </div>
                        {item.description && (
                            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-border mt-1">
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
        case 'error': return "bg-destructive";
        case 'info': return "bg-primary";
        default: return "bg-muted-foreground";
    }
}
