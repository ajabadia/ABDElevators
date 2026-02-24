"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PlatformFinancialsCardProps {
    metrics: any;
}

export function PlatformFinancialsCard({ metrics }: PlatformFinancialsCardProps) {
    const t = useTranslations('admin.superadmin');

    return (
        <Card className="rounded-3xl border-none shadow-sm bg-emerald-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Wallet className="w-24 h-24" />
            </div>
            <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-tighter">{t('financials.title')}</CardTitle>
                <CardDescription className="text-emerald-200">{t('financials.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="flex justify-between items-end border-b border-emerald-800/50 pb-3">
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-widest">{t('financials.expenditure')}</span>
                        <p className="text-2xl font-black">${metrics?.usage?.global?.estimatedCost || 0}</p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-none mb-1">
                        {metrics?.usage?.global?.totalTokens?.toLocaleString()} tokens
                    </Badge>
                </div>

                {/* Proyección Predictiva (Fase 110) */}
                {metrics?.usage?.prediction && (
                    <div className="p-3 rounded-2xl bg-emerald-800/40 border border-emerald-700/50 space-y-2">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-emerald-300 tracking-widest">
                            <span>{t('financials.prediction_title')}</span>
                            <Badge variant="outline" className="text-[9px] border-emerald-500 text-emerald-200">
                                {t('financials.confidence', { percentage: Math.round(metrics.usage.prediction.confidenceScore * 100) })}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-end">
                            <p className="text-xl font-black text-emerald-100">${metrics.usage.prediction.projection.estimatedSpend}</p>
                            <p className="text-[10px] text-emerald-400 font-medium">{t('financials.projection_30d')}</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-end pt-2">
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-widest">{t('financials.platform_value')}</span>
                        <p className="text-2xl font-black text-emerald-400">${metrics?.usage?.global?.estimatedValue || 0}</p>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{t('financials.roi')}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
