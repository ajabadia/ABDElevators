'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuotaProgress } from '@/components/admin/billing/QuotaProgress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, Download, ExternalLink, AlertTriangle, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

// ── Component ──────────────────────────────────────────────────────────────

export default function BillingUsagePage() {
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
                throw new Error('Respuesta inesperada del servidor');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error cargando datos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchUsageData();
    }, [fetchUsageData]);

    // ── Loading Skeleton ───────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-6 p-6" role="status" aria-label="Cargando métricas de uso">
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
        );
    }

    // ── Error State ────────────────────────────────────────────────────────
    if (error || !data) {
        return (
            <div className="space-y-6 p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error cargando métricas</AlertTitle>
                    <AlertDescription>{error || 'No se pudieron cargar los datos.'}</AlertDescription>
                </Alert>
                <Button onClick={() => void fetchUsageData()}>Reintentar</Button>
            </div>
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
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Consumo y Métricas</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitoriza el uso de recursos de tu plan en tiempo real.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/admin/billing/plan')}>
                        Gestionar Plan
                    </Button>
                    <Button onClick={() => window.print()}>
                        <Download className="mr-2 h-4 w-4" /> Exportar Informe
                    </Button>
                </div>
            </div>

            {/* KPI Cards — Usage Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tokens LLM</CardTitle>
                        <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(usage.tokens)}</div>
                        <p className="text-xs text-muted-foreground">
                            de {formatNumber(usage.limits.tokens)} disponibles
                        </p>
                        <QuotaProgress label="" used={usage.tokens} limit={usage.limits.tokens} unit="" className="mt-3" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
                        <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatBytes(usage.storage)}</div>
                        <p className="text-xs text-muted-foreground">
                            de {formatBytesLimit(usage.limits.storage)} disponibles
                        </p>
                        <QuotaProgress label="" used={storageUsedGB} limit={storageLimitGB === Infinity ? -1 : storageLimitGB} unit="GB" className="mt-3" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Búsquedas RAG</CardTitle>
                        <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(usage.searches)}</div>
                        <p className="text-xs text-muted-foreground">
                            de {formatNumber(usage.limits.searches)} disponibles
                        </p>
                        <QuotaProgress label="" used={usage.searches} limit={usage.limits.searches} unit="" className="mt-3" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                        <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(usage.users)}</div>
                        <p className="text-xs text-muted-foreground">
                            de {formatNumber(usage.limits.users)} permitidos
                        </p>
                        <QuotaProgress label="" used={usage.users} limit={usage.limits.users} unit="" className="mt-3" />
                    </CardContent>
                </Card>
            </div>

            {/* ROI + Plan Status */}
            <div className="grid gap-6 md:grid-cols-7">
                {/* ROI Card */}
                <div className="col-span-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>ROI Estimado (30 días)</CardTitle>
                            <CardDescription>
                                Ahorro acumulado por automatización IA vs. gestión manual
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col items-center p-4 rounded-lg bg-primary/5 border border-primary/10">
                                    <Clock className="h-5 w-5 text-primary mb-2" aria-hidden="true" />
                                    <span className="text-2xl font-bold text-primary">{roi.roi.totalSavedHours}h</span>
                                    <span className="text-xs text-muted-foreground text-center mt-1">Horas Ahorradas</span>
                                </div>
                                <div className="flex flex-col items-center p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                    <DollarSign className="h-5 w-5 text-emerald-600 mb-2" aria-hidden="true" />
                                    <span className="text-2xl font-bold text-emerald-600">
                                        ${roi.roi.estimatedCostSavings.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-muted-foreground text-center mt-1">Ahorro Estimado</span>
                                </div>
                                <div className="flex flex-col items-center p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                    <TrendingUp className="h-5 w-5 text-blue-600 mb-2" aria-hidden="true" />
                                    <span className="text-2xl font-bold text-blue-600">{roi.efficiencyScore}%</span>
                                    <span className="text-xs text-muted-foreground text-center mt-1">Eficiencia</span>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                <div>Análisis: {roi.metrics.analysisCount}</div>
                                <div>Búsquedas: {roi.metrics.vectorSearches}</div>
                                <div>Dedup: {roi.metrics.dedupEvents}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Plan Status + Advice */}
                <div className="col-span-3 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado del Plan</CardTitle>
                            <CardDescription>
                                Suscripción: <span className="font-semibold capitalize">{usage.status}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Plan Actual</span>
                                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold ring-1 ring-primary/20">
                                    {usage.tier}
                                </span>
                            </div>
                            <Button variant="outline" className="w-full justify-between" onClick={() => router.push('/admin/billing/plan')}>
                                Gestionar Suscripción <ExternalLink className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    {criticalMetrics.length > 0 ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Atención: Cuota cercana al límite</AlertTitle>
                            <AlertDescription>
                                {criticalMetrics[0][1].status === 'BLOCKED'
                                    ? `El recurso "${criticalMetrics[0][0]}" ha superado tu cuota. Actualiza tu plan para continuar.`
                                    : `El recurso "${criticalMetrics[0][0]}" está al ${criticalMetrics[0][1].percentage.toFixed(0)}% de uso. Considera actualizar tu plan.`
                                }
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Todo en orden</AlertTitle>
                            <AlertDescription>
                                Tu consumo está dentro de los límites del plan. Sin riesgo de bloqueo este mes.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </div>
    );
}
