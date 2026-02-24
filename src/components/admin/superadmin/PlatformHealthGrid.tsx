"use client";

import React from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import {
    Users,
    Briefcase,
    Brain,
    Activity,
    Clock,
    Zap
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PlatformHealthGridProps {
    metrics: any;
}

export function PlatformHealthGrid({ metrics }: PlatformHealthGridProps) {
    const t = useTranslations('admin.superadmin');

    return (
        <div className="space-y-8">
            {/* Real-time Health Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title={t('metrics.tenants')}
                    value={metrics?.tenants?.active || 0}
                    icon={<Users className="w-5 h-5" />}
                    description={t('metrics.tenants_cluster', { total: metrics?.tenants?.total || 0 })}
                />
                <MetricCard
                    title={t('metrics.cases')}
                    value={metrics?.cases?.total || 0}
                    icon={<Briefcase className="w-5 h-5" />}
                    trend="+12%"
                    trendDirection="up"
                />
                <MetricCard
                    title={t('metrics.ai_accuracy')}
                    value={`${metrics?.ai?.accuracy || 0}%`}
                    icon={<Brain className="w-5 h-5" />}
                    description={t('metrics.ai_validations', { count: metrics?.ai?.totalFeedbacks || 0 })}
                />
            </div>

            {/* ERA 7: Platform Observability Hub */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title={t('metrics.ai_health')}
                    value={`${metrics?.ai?.telemetry?.successRate || 100}%`}
                    icon={<Activity className="w-5 h-5 text-emerald-500" />}
                    description={t('metrics.health_stat', { success: metrics?.ai?.health?.success || 0, failure: metrics?.ai?.health?.failure || 0 })}
                    className="bg-emerald-50/50 border-emerald-100"
                />
                <MetricCard
                    title={t('metrics.latency')}
                    value={`${metrics?.ai?.telemetry?.avgLatency || 0}ms`}
                    icon={<Clock className="w-5 h-5 text-indigo-500" />}
                    description={t('metrics.latency_desc')}
                    className="bg-indigo-50/50 border-indigo-100"
                />
                <MetricCard
                    title={t('metrics.consumption')}
                    value={metrics?.usage?.prediction?.projection?.estimatedSpend ? `$${metrics.usage.prediction.projection.estimatedSpend}` : "---"}
                    icon={<Zap className="w-5 h-5 text-amber-500" />}
                    description={t('metrics.consumption_desc')}
                    className="bg-amber-50/50 border-amber-100"
                />
            </div>
        </div>
    );
}
