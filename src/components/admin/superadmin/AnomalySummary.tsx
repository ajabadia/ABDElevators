"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    Zap,
    LayoutDashboard
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AnomalySummaryProps {
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}

/**
 * 🚨 Anomaly Summary Widget (Phase 268)
 * Categorical breakdown of platform alerts.
 */
export function AnomalySummary({ summary }: AnomalySummaryProps) {
    const t = useTranslations('admin_superadmin');

    const categories = [
        {
            key: 'critical',
            label: t('gov.severity.critical'),
            count: summary?.critical || 0,
            color: 'text-red-600',
            bg: 'bg-red-50',
            icon: <Zap className="w-4 h-4" />
        },
        {
            key: 'high',
            label: t('gov.severity.high'),
            count: summary?.high || 0,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            icon: <AlertCircle className="w-4 h-4" />
        },
        {
            key: 'medium',
            label: t('gov.severity.medium'),
            count: summary?.medium || 0,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            icon: <AlertTriangle className="w-4 h-4" />
        },
        {
            key: 'low',
            label: t('gov.severity.low'),
            count: summary?.low || 0,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            icon: <Info className="w-4 h-4" />
        },
    ];

    return (
        <Card className="rounded-3xl border-none shadow-sm bg-white h-full">
            <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-sidebar-primary" />
                    {t('gov.anomaly_summary_title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                    {categories.map((cat) => (
                        <div
                            key={cat.key}
                            className={`p-4 rounded-3xl ${cat.bg} border border-transparent transition-all flex flex-col items-center justify-center text-center space-y-2`}
                        >
                            <div className={`${cat.color} p-2 rounded-full bg-white shadow-sm`}>
                                {cat.icon}
                            </div>
                            <div>
                                <p className={`text-2xl font-black ${cat.color}`}>
                                    {cat.count}
                                </p>
                                <p className="text-[10px] font-bold uppercase text-slate-500 opacity-70">
                                    {cat.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                {(!summary || Object.values(summary).every(v => v === 0)) && (
                    <div className="mt-4 text-center py-4 text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4 fill-emerald-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('gov.status.all_clear')}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
