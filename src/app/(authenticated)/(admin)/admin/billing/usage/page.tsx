'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuotaProgress } from '@/components/admin/billing/QuotaProgress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, Download, AlertTriangle, TrendingUp, Clock, DollarSign, LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface UsageMetricStatus {
    status: 'ALLOWED' | 'OVERAGE_WARNING' | 'BLOCKED';
    percentage: number;
}

interface UsageApiResponse {
    success: boolean;
    data: {
        usage: {
            status: string;
            planSlug: string;
            tier: string;
            tokens: number;
            storage: number;
            searches: number;
            api_requests: number;
            users: number;
            spaces_per_tenant: number;
            limits: {
                tokens: number;
                storage: number;
                searches: number;
                api_requests: number;
                users: number;
                spaces_per_tenant: number;
                spaces_per_user: number;
            };
            metricStatus: {
                tokens: UsageMetricStatus;
                storage: UsageMetricStatus;
                searches: UsageMetricStatus;
                api_requests: UsageMetricStatus;
                users: UsageMetricStatus;
                spaces_per_tenant: UsageMetricStatus;
            };
        };
        roi: {
            period: string;
            metrics: {
                analysisCount: number;
                vectorSearches: number;
                dedupEvents: number;
                savedTokens: number;
            };
            roi: {
                totalSavedHours: number;
                estimatedCostSavings: number;
                currency: string;
                breakdown: {
                    analysisHours: number;
                    searchHours: number;
                    dedupHours: number;
                };
            };
            efficiencyScore: number;
        };
    };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes === Infinity) return '∞';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

function formatBytesLimit(bytes: number): string {
    if (bytes === Infinity) return '∞';
    return formatBytes(bytes);
}

function formatNumber(n: number): string {
    if (n === Infinity) return '∞';
    return n.toLocaleString();
}

// ── Local Components ───────────────────────────────────────────────────────

interface MetricCardProps {
    title: string;
    value: string;
    subtext: string;
    used: number;
    limit: number;
    unit?: string;
}

function MetricCard({ title, value, subtext, used, limit, unit }: MetricCardProps) {
    return (
        <Card className="animate-in fade-in zoom-in-95 duration-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{subtext}</p>
                <QuotaProgress label="" used={used} limit={limit} unit={unit || ""} className="mt-3" />
            </CardContent>
        </Card>
    );
}

interface RoiStatProps {
    icon: LucideIcon;
    value: string;
    label: string;
    variant: 'primary' | 'success' | 'info';
}

function RoiStat({ icon: Icon, value, label, variant }: RoiStatProps) {
    const variants = {
        primary: "bg-primary/5 border-primary/10 text-primary",
        success: "bg-green-500/5 border-green-500/10 text-green-600 dark:text-green-400",
        info: "bg-blue-500/5 border-blue-500/10 text-blue-600 dark:text-blue-400"
    };

    return (
        <div className={cn("flex flex-col items-center p-4 rounded-lg border", variants[variant])}>
            <Icon className="h-5 w-5 mb-2" aria-hidden="true" />
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-xs text-muted-foreground text-center mt-1">{label}</span>
        </div>
    );
}

// ── Main Page Component ────────────────────────────────────────────────────

export default function BillingUsagePage() {
    const t = useTranslations('admin.billing_usage');
    const router = useRouter();
    const [data, setData] = useState<UsageApiResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsageData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/admin/billing/usage');
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as Record<string, string>).message || `Error ${res.status}`);
            }
            const json: UsageApiResponse = await res.json();
            if (json.success) {
                setData(json.data);
            } else {
                throw new Error(t('alerts.error_unexpected'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('alerts.error_title'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        void fetchUsageData();
    }, [fetchUsageData]);

    // ── Loading Skeleton ───────────────────────────────────────────────────
    if (loading) {
        return (
            <PageContainer className="animate-in fade-in duration-500">
                <div className="space-y-6" role="status" aria-label={t('loading_label')}>
                    <div className="flex justify-between items-center">
                        <div>
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-96 mt-2" />
                        </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map(i => (
                            <Card key={i}>
                                <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                                <CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-2 w-full mt-3" /></CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </PageContainer>
        );
    }

    // ── Error State ────────────────────────────────────────────────────────
    if (error || !data) {
        return (
            <PageContainer className="animate-in fade-in duration-500">
                <div className="space-y-6">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t('alerts.error_title')}</AlertTitle>
                        <AlertDescription>{error || t('alerts.ok_description')}</AlertDescription>
                    </Alert>
                    <Button onClick={() => void fetchUsageData()}>{t('alerts.retry')}</Button>
                </div>
            </PageContainer>
        );
    }

    const { usage, roi } = data;
    const storageUsedGB = usage.storage / (1024 * 1024 * 1024);
    const storageLimitGB = usage.limits.storage === Infinity ? Infinity : usage.limits.storage / (1024 * 1024 * 1024);

    // Determine the most critical metric for the advice card
    const criticalMetrics = Object.entries(usage.metricStatus)
        .filter(([, v]) => v.status === 'OVERAGE_WARNING' || v.status === 'BLOCKED')
        .sort((a, b) => b[1].percentage - a[1].percentage);

    return (
        <PageContainer className="animate-in fade-in duration-500">
            {/* Header */}
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push('/admin/billing/plan')}>
                            {t('manage_plan')}
                        </Button>
                        <Button onClick={() => window.print()}>
                            <Download className="mr-2 h-4 w-4" /> {t('export_report')}
                        </Button>
                    </div>
                }
            />

            {/* KPI Cards — Usage Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
                <MetricCard
                    title={t('tokens.title')}
                    value={formatNumber(usage.tokens)}
                    subtext={t('tokens.limit', { limit: formatNumber(usage.limits.tokens) })}
                    used={usage.tokens}
                    limit={usage.limits.tokens}
                />
                <MetricCard
                    title={t('storage.title')}
                    value={formatBytes(usage.storage)}
                    subtext={t('storage.limit', { limit: formatBytesLimit(usage.limits.storage) })}
                    used={storageUsedGB}
                    limit={storageLimitGB === Infinity ? -1 : storageLimitGB}
                    unit="GB"
                />
                <MetricCard
                    title={t('searches.title')}
                    value={formatNumber(usage.searches)}
                    subtext={t('searches.limit', { limit: formatNumber(usage.limits.searches) })}
                    used={usage.searches}
                    limit={usage.limits.searches}
                />
                <MetricCard
                    title={t('users.title')}
                    value={formatNumber(usage.users)}
                    subtext={t('users.limit', { limit: formatNumber(usage.limits.users) })}
                    used={usage.users}
                    limit={usage.limits.users}
                />
            </div>

            {/* ROI + Plan Status */}
            <div className="grid gap-6 md:grid-cols-7 mt-6">
                {/* ROI Card */}
                <div className="col-span-1 md:col-span-4">
                    <Card className="h-full bg-card/50 backdrop-blur-sm border-border animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <CardHeader>
                            <CardTitle>{t('roi.title')}</CardTitle>
                            <CardDescription>
                                {t('roi.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <RoiStat
                                    icon={Clock}
                                    value={`${roi.roi.totalSavedHours}h`}
                                    label={t('roi.saved_hours')}
                                    variant="primary"
                                />
                                <RoiStat
                                    icon={DollarSign}
                                    value={`$${roi.roi.estimatedCostSavings.toLocaleString()}`}
                                    label={t('roi.estimated_savings')}
                                    variant="success"
                                />
                                <RoiStat
                                    icon={TrendingUp}
                                    value={`${(roi as any).efficiencyScore || 0}%`}
                                    label={t('roi.efficiency')}
                                    variant="info"
                                />
                            </div>
                            <div className="mt-6 grid grid-cols-3 gap-2 text-xs text-muted-foreground border-t pt-4">
                                <div className="text-center">{t('roi.breakdown.analysis', { count: roi.metrics.analysisCount })}</div>
                                <div className="text-center border-l border-r">{t('roi.breakdown.searches', { count: roi.metrics.vectorSearches })}</div>
                                <div className="text-center">{t('roi.breakdown.dedup', { count: roi.metrics.dedupEvents })}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Plan Status + Advice */}
                <div className="col-span-1 md:col-span-3 space-y-6">
                    <Card className="bg-card/50 backdrop-blur-sm border-border animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                        <CardHeader>
                            <CardTitle>{t('plan_status.title')}</CardTitle>
                            <CardDescription>
                                {t('plan_status.subscription', { status: usage.status })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{t('plan_status.current_plan')}</span>
                                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold ring-1 ring-primary/20">
                                    {usage.tier}
                                </span>
                            </div>
                            <Button variant="outline" className="w-full justify-between group" onClick={() => router.push('/admin/billing/plan')}>
                                {t('plan_status.manage')} <TrendingUp className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                        {criticalMetrics.length > 0 ? (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>{t('alerts.critical_title')}</AlertTitle>
                                <AlertDescription>
                                    {criticalMetrics[0][1].status === 'BLOCKED'
                                        ? t('alerts.blocked', { resource: criticalMetrics[0][0] })
                                        : t('alerts.warning', { resource: criticalMetrics[0][0], percentage: criticalMetrics[0][1].percentage.toFixed(0) })
                                    }
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
                                <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertTitle>{t('alerts.ok_title')}</AlertTitle>
                                <AlertDescription>
                                    {t('alerts.ok_description')}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
