"use client";

import React, { useEffect, useState } from 'react';
import { Cpu, Database, Search, Activity, Zap, HardDrive, RefreshCcw, CreditCard, FileText, AlertTriangle, Download, Settings, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlanSelector } from './PlanSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateInvoicePDF } from '@/lib/pdf-invoice-client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useApiItem } from '@/hooks/useApiItem';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslations } from 'next-intl';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface UsageStats {
    tokens: number;
    storage: number;
    searches: number;
    reports_generated: number;
    api_requests: number;
    savings?: number;
    embeddings?: number;
    history: any[];
    tier?: string;
    planSlug?: string;
    limits?: {
        tokens: number;
        storage: number;
        searches: number;
        api_requests: number;
        reports: number;
    };
    status?: {
        metric: string;
        state: 'ALLOWED' | 'SURCHARGE' | 'BLOCKED';
        details?: string;
    }[];
}

export function ConsumptionDashboard() {
    const t = useTranslations('admin.consumption');
    const { toast } = useToast();
    const [isMounted, setIsMounted] = useState(false);

    // 1. Carga de estadísticas con hook genérico
    const {
        data: stats,
        isLoading,
        refresh: fetchStats,
        error
    } = useApiItem<UsageStats>({
        endpoint: '/api/admin/usage/stats',
        dataKey: 'stats'
    });

    const [downloading, setDownloading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useLocalStorage('admin-billing-autorefresh', false);

    // Auto-refresh logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchStats();
            }, 10000); // 10s
        }
        return () => clearInterval(interval);
    }, [autoRefresh, fetchStats]);

    // 2. Gestión de datos fiscales con hook genérico
    const [fiscalOpen, setFiscalOpen] = useState(false);
    const [fiscalDraft, setFiscalDraft] = useState({
        fiscalName: '',
        taxId: '',
        address: ''
    });

    const {
        data: fiscalData,
        refresh: refreshFiscal
    } = useApiItem<any>({
        endpoint: '/api/admin/billing/fiscal',
        autoFetch: true,
        onSuccess: (data) => {
            if (data) {
                setFiscalDraft({
                    fiscalName: data.fiscalName || '',
                    taxId: data.taxId || '',
                    address: data.address || ''
                });
            }
        }
    });

    // Mutación para guardar datos fiscales
    const fiscalMutation = useApiMutation({
        endpoint: '/api/admin/billing/fiscal',
        method: 'PATCH',
        successMessage: t('billing.dialog.saving'),
        onSuccess: () => {
            setFiscalOpen(false);
            refreshFiscal();
        }
    });

    // 3. Carga de preview de factura
    const {
        data: invoiceData,
        isLoading: loadingInvoice
    } = useApiItem<any>({
        endpoint: '/api/admin/billing/invoice-preview',
        autoFetch: true
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleDownloadInvoice = async () => {
        setDownloading(true);
        try {
            const res = await fetch('/api/admin/billing/invoice-preview');
            if (!res.ok) throw new Error('Error al generar preview');
            const data = await res.json();

            // Generar PDF en cliente
            generateInvoicePDF(data.invoice);

            toast({ title: t('invoice.success'), description: t('invoice.success_desc') });
        } catch (error) {
            console.error(error);
            toast({ title: t('invoice.error'), description: t('invoice.error_desc'), variant: 'destructive' });
        } finally {
            setDownloading(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return t('format.zero_bytes');
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getUsagePercentage = (current: number, limit: number) => {
        if (!limit || limit === Infinity) return 0;
        return Math.min((current / limit) * 100, 100);
    };

    const getAlertColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-red-500';
        if (percentage >= 80) return 'bg-amber-500';
        return '';
    };

    if (error) {
        return (
            <div className="p-6 rounded-lg border border-red-200 bg-red-50 text-red-800">
                <h3 className="font-bold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> Error cargando métricas
                </h3>
                <p className="text-sm mt-1">{error || "Error desconocido"}</p>
                <Button variant="outline" size="sm" onClick={fetchStats} className="mt-4 bg-white hover:bg-red-50 border-red-200">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Reintentar
                </Button>
            </div>
        );
    }

    if (!isMounted || (isLoading && !stats)) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <RefreshCcw className="animate-spin text-teal-600 h-8 w-8" />
                <p className="text-slate-400 text-sm animate-pulse">{t('loading')}</p>
            </div>
        );
    }

    // Defensive: If ready but no stats, show empty state or error
    if (!stats) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                No hay datos de consumo disponibles.
            </div>
        );
    }

    // Defensive: If ready but no stats, show empty state or error
    if (!stats) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                No hay datos de consumo disponibles.
            </div>
        );
    }

    const blockedStatus = Array.isArray(stats.status) ? stats.status.find(s => s.state === 'BLOCKED') : undefined;
    const surchargeStatus = Array.isArray(stats.status) ? stats.status.find(s => s.state === 'SURCHARGE') : undefined;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header y Acción */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="text-amber-500" /> {t('title')}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 text-sm">
                            {t('subtitle')}
                        </p>
                        {stats?.tier && (
                            <Badge variant="secondary" className="bg-teal-100 dark:bg-teal-900/30 text-teal-600 font-bold">
                                {t('plan_label', { tier: stats.tier })}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Status Alerts */}
                {blockedStatus && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg border border-red-200 animate-pulse">
                        <AlertTriangle size={18} />
                        <span className="text-sm font-bold">{t('alerts.blocked', { details: blockedStatus.details || '' })}</span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={cn("gap-2", autoRefresh ? "bg-teal-50 border-teal-200 text-teal-700 shadow-inner" : "")}
                    >
                        <RefreshCcw size={14} className={autoRefresh ? "animate-spin" : ""} />
                        {autoRefresh ? t('auto_on') : t('auto_off')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchStats}
                        className={cn("h-9 w-9", isLoading ? "animate-spin" : "")}
                    >
                        <RefreshCcw size={16} />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="metrics" className="w-full space-y-6">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <TabsTrigger value="metrics" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">{t('tabs.metrics')}</TabsTrigger>
                    <TabsTrigger value="billing" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">{t('tabs.billing')}</TabsTrigger>
                </TabsList>

                <TabsContent value="metrics" className="space-y-8 animate-in slide-in-from-left-2 duration-300">
                    {/* Grid de Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="consumption-stats">

                        {/* Informes Generados (Principal) */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative border-l-4 border-l-teal-500">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                                <FileText size={120} />
                            </div>
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-xl">
                                    <FileText size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('metrics.reports.label')}</span>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {stats?.reports_generated?.toLocaleString() ?? '0'}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {t('metrics.reports.desc')}
                                {stats?.limits?.reports != null && stats.limits.reports !== Infinity && (
                                    <span className="ml-2 text-xs text-slate-400">/ {stats.limits.reports.toLocaleString()}</span>
                                )}
                            </p>
                            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${getAlertColor(getUsagePercentage(stats?.reports_generated || 0, stats?.limits?.reports || Infinity)) || 'bg-teal-500'}`}
                                    style={{ width: `${getUsagePercentage(stats?.reports_generated || 0, stats?.limits?.reports || Infinity)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* AI Tokens */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                                <Cpu size={120} />
                            </div>
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                    <Cpu size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('metrics.tokens.label')}</span>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {stats?.tokens?.toLocaleString() || '0'}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {t('metrics.tokens.desc')}
                                {stats?.limits?.tokens != null && stats.limits.tokens !== Infinity && (
                                    <span className="ml-2 text-xs text-slate-400">/ {stats.limits.tokens.toLocaleString()}</span>
                                )}
                            </p>
                            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${getAlertColor(getUsagePercentage(stats?.tokens || 0, stats?.limits?.tokens || Infinity)) || 'bg-blue-500'}`}
                                    style={{ width: `${getUsagePercentage(stats?.tokens || 0, stats?.limits?.tokens || Infinity)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Storage */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                                <HardDrive size={120} />
                            </div>
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                                    <Database size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('metrics.storage.label')}</span>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {formatBytes(stats?.storage || 0)}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {t('metrics.storage.desc')}
                                {stats?.limits?.storage != null && stats.limits.storage !== Infinity && (
                                    <span className="ml-2 text-xs text-slate-400">/ {formatBytes(stats.limits.storage)}</span>
                                )}
                            </p>
                            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${getAlertColor(getUsagePercentage(stats?.storage || 0, stats?.limits?.storage || Infinity)) || 'bg-indigo-500'}`}
                                    style={{ width: `${getUsagePercentage(stats?.storage || 0, stats?.limits?.storage || Infinity)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Vector Searches */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                                <Search size={120} />
                            </div>
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                                    <Search size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('metrics.search.label')}</span>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {stats?.searches?.toLocaleString() ?? '0'}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {t('metrics.search.desc')}
                                {stats?.limits?.searches != null && stats.limits.searches !== Infinity && (
                                    <span className="ml-2 text-xs text-slate-400">/ {stats.limits.searches.toLocaleString()}</span>
                                )}
                            </p>
                            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${getAlertColor(getUsagePercentage(stats?.searches || 0, stats?.limits?.searches || Infinity)) || 'bg-amber-500'}`}
                                    style={{ width: `${getUsagePercentage(stats?.searches || 0, stats?.limits?.searches || Infinity)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* ROI & Trend Analytics (Phase 120.4) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl bg-slate-950 text-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="text-teal-400" /> {t('charts.tokens_title')}
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    {t('charts.tokens_desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={(stats?.history || []).slice(0, 15).reverse().map(h => ({
                                        date: new Date(h.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                                        tokens: h.type === 'LLM_TOKENS' ? h.value : 0,
                                        savings: h.type === 'SAVINGS_TOKENS' ? h.value : 0
                                    }))}>
                                        <defs>
                                            <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                            itemStyle={{ fontSize: '12px' }}
                                        />
                                        <Area type="monotone" dataKey="tokens" stroke="#0d9488" fillOpacity={1} fill="url(#colorTokens)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Smart Savings Summary */}
                        <div className="bg-gradient-to-br from-indigo-600 to-teal-600 p-8 rounded-2xl text-white shadow-xl shadow-teal-500/20 relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute right-0 top-0 opacity-10">
                                <Zap size={240} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <Zap className="text-amber-300" /> {t('savings.title')}
                                </h3>
                                <p className="text-indigo-100 text-sm mb-6">
                                    {t('savings.desc')}
                                </p>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-indigo-200 text-xs uppercase font-bold tracking-wider mb-1">{t('savings.tokens')}</p>
                                        <p className="text-4xl font-black">{((stats as any)?.savings || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-indigo-200 text-xs uppercase font-bold tracking-wider mb-1">{t('savings.efficiency')}</p>
                                        <p className="text-4xl font-black">
                                            {stats?.tokens && stats.savings
                                                ? Math.round((stats.savings / (stats.savings + stats.tokens)) * 100)
                                                : 0}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Multilingual Support Status */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Search size={16} /> {t('multilingual.title')}
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-slate-600 dark:text-slate-400 text-sm">{t('multilingual.label')}</span>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{(stats as any)?.embeddings || 0}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    </div>


                    {/* Registro de Actividad */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <Activity size={18} className="text-teal-500" /> {t('activity.title')}
                            </h3>
                            <span className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-600 px-2 py-1 rounded-full font-medium">{t('activity.limit')}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('activity.table.date')}</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('activity.table.type')}</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('activity.table.resource')}</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">{t('activity.table.amount')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {(stats?.history || []).map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-teal-900/5 transition-colors">
                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {log.resource}
                                            </td>
                                            <td className="p-4 text-sm font-bold text-right text-slate-900 dark:text-white">
                                                {log.type === 'STORAGE_BYTES' ? formatBytes(log.value || 0) : (log.value || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="billing" className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Configuración Fiscal */}
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Building2 className="text-slate-400" /> {t('billing.title')}
                                </CardTitle>
                                <CardDescription>{t('billing.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm text-slate-600">
                                    <p><span className="font-bold">{t('billing.fields.fiscal_name')}:</span> {fiscalData?.fiscalName || t('billing.not_configured')}</p>
                                    <p><span className="font-bold">{t('billing.fields.tax_id')}:</span> {fiscalData?.taxId || '---'}</p>
                                    <p><span className="font-bold">{t('billing.fields.address')}:</span> {fiscalData?.address || '---'}</p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Dialog open={fiscalOpen} onOpenChange={setFiscalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline"><Settings className="w-4 h-4 mr-2" /> {t('billing.edit')}</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{t('billing.dialog.title')}</DialogTitle>
                                            <DialogDescription>{t('billing.dialog.desc')}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>{t('billing.dialog.fiscal_name_label')}</Label>
                                                <Input value={fiscalDraft.fiscalName} onChange={e => setFiscalDraft(prev => ({ ...prev, fiscalName: e.target.value }))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('billing.dialog.tax_id_label')}</Label>
                                                <Input value={fiscalDraft.taxId} onChange={e => setFiscalDraft(prev => ({ ...prev, taxId: e.target.value }))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('billing.dialog.address_label')}</Label>
                                                <Input value={fiscalDraft.address} onChange={e => setFiscalDraft(prev => ({ ...prev, address: e.target.value }))} />
                                            </div>
                                            <Button
                                                onClick={() => fiscalMutation.mutate(fiscalDraft)}
                                                className="w-full"
                                                disabled={fiscalMutation.isLoading}
                                            >
                                                {fiscalMutation.isLoading ? t('billing.dialog.saving') : t('billing.dialog.save')}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>

                        {/* Próxima Factura */}
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="text-teal-500" /> {t('invoice.title')}
                                </CardTitle>
                                <CardDescription>{t('invoice.closing', { date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString() })}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                                <div className="text-4xl font-black text-slate-800 dark:text-white">
                                    {loadingInvoice ? (
                                        <Loader2 className="animate-spin h-8 w-8 text-teal-500" />
                                    ) : (
                                        `${(invoiceData?.totalAmount || 0).toLocaleString()} €`
                                    )}
                                </div>
                                <Badge variant="outline" className="text-xs text-slate-500">
                                    {invoiceData?.tierName || t('invoice.tier_estimate')}
                                </Badge>
                                {invoiceData?.isManual && (
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                                        Modo Facturación Manual
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-teal-600 hover:bg-teal-500" onClick={handleDownloadInvoice} disabled={downloading}>
                                    {downloading ? (
                                        <>{t('invoice.generating')}</>
                                    ) : (
                                        <><Download className="w-4 h-4 mr-2" /> {t('invoice.download_preview')}</>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Gestión del Plan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="text-blue-500" /> {t('subscription.title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PlanSelector
                                currentPlanSlug={stats?.planSlug}
                                onPlanChanged={fetchStats}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}

