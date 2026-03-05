"use client";

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ContentCard } from '@/components/ui/content-card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Info, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetQuality {
    assetId: string;
    filename: string;
    totalFeedback: number;
    negativeRate: number; // 0 to 1
    topIssue?: string;
}

interface QualityHeatmapProps {
    data: AssetQuality[];
    isLoading?: boolean;
}

/**
 * QualityHeatmap — Phase 266
 * 
 * High-density visualization of knowledge assets requiring attention.
 */
export function QualityHeatmap({ data, isLoading }: QualityHeatmapProps) {
    const t = useTranslations("technical");

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => b.negativeRate - a.negativeRate);
    }, [data]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="h-10 w-10 text-teal-500 mb-4" />
                <h3 className="font-bold text-lg">{t('quality_pristine', { defaultValue: "Calidad Impecable" })}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    {t('no_negative_feedback', { defaultValue: "No se han detectado activos con feedback negativo relevante." })}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedData.map((asset) => (
                <ContentCard
                    key={asset.assetId}
                    className={cn(
                        "relative overflow-hidden transition-all hover:ring-2",
                        asset.negativeRate > 0.5 ? "hover:ring-red-500/50" : "hover:ring-teal-500/50"
                    )}
                >
                    <div
                        className={cn(
                            "absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 -mr-12 -mt-12 rounded-full",
                            asset.negativeRate > 0.5 ? "bg-red-500" : "bg-amber-500"
                        )}
                    />

                    <div className="space-y-3">
                        <div className="flex justify-between items-start">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[10px] uppercase font-black tracking-tighter",
                                    asset.negativeRate > 0.5
                                        ? "text-red-600 border-red-200 bg-red-50"
                                        : "text-amber-600 border-amber-200 bg-amber-50"
                                )}
                            >
                                {Math.round(asset.negativeRate * 100)}% {t('negative_rate_label', { defaultValue: "CRÍTICO" })}
                            </Badge>
                            <span className="text-[10px] font-mono text-slate-400">
                                {asset.totalFeedback} FB
                            </span>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm truncate" title={asset.filename}>
                                {asset.filename}
                            </h4>
                            {asset.topIssue && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                                    <TrendingDown className="h-3 w-3 text-red-500" />
                                    {asset.topIssue}
                                </p>
                            )}
                        </div>

                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000",
                                    asset.negativeRate > 0.5 ? "bg-red-500" : "bg-amber-500"
                                )}
                                style={{ width: `${asset.negativeRate * 100}%` }}
                            />
                        </div>
                    </div>
                </ContentCard>
            ))}
        </div>
    );
}
