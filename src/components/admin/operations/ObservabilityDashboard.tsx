"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Zap, Server, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface AnalyticsData {
    tokens: { date: string; tokens: number }[];
    rag: { precision: number; samples: number };
    health: { score: number; errorCount: number };
    roi: any;
}

export function ObservabilityDashboard() {
    const t = useTranslations('admin.observability');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/analytics/summary");
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (error) {
                toast.error(t('error'), {
                    description: t('error_desc')
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-muted-foreground">{t('loading')}</div>;
    if (!data) return null;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('health.title')}</CardTitle>
                    <Activity className={`h-4 w-4 ${data.health.score > 90 ? 'text-green-500' : 'text-red-500'}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.health.score}%</div>
                    <p className="text-xs text-muted-foreground">
                        {t('health.errors_24h', { count: data.health.errorCount })}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('rag.title')}</CardTitle>
                    <Zap className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(data.rag.precision * 100).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                        {t('rag.samples', { count: data.rag.samples })}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('tokens.title')}</CardTitle>
                    <Server className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {data.tokens.reduce((acc, curr) => acc + curr.tokens, 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t('tokens.total')}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('savings.title')}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        ${data.roi?.roi?.estimatedCostSavings.toLocaleString() || '0'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t('savings.hours', { count: data.roi?.roi?.totalSavedHours || 0 })}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
