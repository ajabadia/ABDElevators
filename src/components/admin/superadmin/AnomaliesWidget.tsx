"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AnomaliesWidgetProps {
    anomalyData: any;
    isLoadingAnomalies: boolean;
}

export function AnomaliesWidget({ anomalyData, isLoadingAnomalies }: AnomaliesWidgetProps) {
    const t = useTranslations('admin.superadmin');

    return (
        <Card className="rounded-3xl border-none shadow-sm bg-slate-50/50 h-full">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        {t('anomalies.title')}
                    </div>
                    {anomalyData?.anomalies?.total > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            {t('anomalies.alerts', { count: anomalyData.anomalies.total })}
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>{t('anomalies.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {isLoadingAnomalies ? (
                    [1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)
                ) : anomalyData?.anomalies?.total === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">{t('anomalies.no_anomalies')}</p>
                    </div>
                ) : (
                    <>
                        {[...(anomalyData.anomalies.latency || []), ...(anomalyData.anomalies.errors || [])].map((anomaly: any) => (
                            <div key={anomaly.id} className="p-3 rounded-xl bg-white border border-slate-100 flex items-start gap-4">
                                <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${anomaly.severity === 'CRITICAL' ? 'bg-red-500' :
                                    anomaly.severity === 'HIGH' ? 'bg-orange-500' : 'bg-amber-500'
                                    }`} />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-800 leading-tight">{anomaly.message}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Z-score: {anomaly.details?.zScore?.toFixed(2) || '0.00'} | {anomaly.timestamp ? new Date(anomaly.timestamp).toLocaleTimeString() : '--:--'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
