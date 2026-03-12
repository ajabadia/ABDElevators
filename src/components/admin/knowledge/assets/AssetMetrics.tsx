"use client";

import React from 'react';
import { Layers, Database, History } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { useTranslations } from "next-intl";

interface AssetMetricsProps {
    stats: {
        active: number;
        totalChunks: number;
        lastIngest: string;
    };
}

/**
 * AssetMetrics — ERA 14 Refactor
 * Displays the key metrics for knowledge assets.
 */
export function AssetMetrics({ stats }: AssetMetricsProps) {
    const t = useTranslations('knowledge_assets');

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
                title={t('metrics.active')}
                value={stats.active}
                icon={<Layers className="w-5 h-5" />}
            />
            <MetricCard
                title={t('metrics.indexed')}
                value={stats.totalChunks}
                icon={<Database className="w-5 h-5" />}
            />
            <MetricCard
                title={t('metrics.last_ingest')}
                value={stats.lastIngest}
                icon={<History className="w-5 h-5" />}
            />
        </div>
    );
}
