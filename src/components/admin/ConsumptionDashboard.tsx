"use client";

import React, { useEffect, useState } from 'react';
import { Cpu, Database, Search, Activity, Zap, HardDrive, RefreshCcw, CreditCard, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlanSelector } from './PlanSelector';

interface UsageStats {
    tokens: number;
    storage: number;
    searches: number;
    reports_generated: number; // New metric
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
        reports: number; // New limit
    };
    status?: {
        metric: string;
        state: 'ALLOWED' | 'SURCHARGE' | 'BLOCKED';
        details?: string;
    }[];
}

export function ConsumptionDashboard() {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/usage/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch (err) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar las estadísticas de consumo.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getUsagePercentage = (current: number, limit: number) => {
        if (limit === Infinity || limit === 0) return 0;
        return Math.min((current / limit) * 100, 100);
    };

    const getAlertColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-red-500';
        if (percentage >= 80) return 'bg-amber-500';
        return '';
    };


    if (loading && !stats) {
        return <div className="flex items-center justify-center p-20"><RefreshCcw className="animate-spin text-teal-600" /></div>;
    }

    const blockedStatus = stats?.status?.find(s => s.state === 'BLOCKED');
    const surchargeStatus = stats?.status?.find(s => s.state === 'SURCHARGE');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header y Acción */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="text-amber-500" /> Control de Consumo
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 text-sm">
                            Monitorización de recursos en tiempo real
                        </p>
                        {stats?.tier && (
                            <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-md text-xs font-bold">
                                Plan {stats.tier}
                            </span>
                        )}
                    </div>
                </div>

                {/* Status Alerts */}
                {blockedStatus && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg border border-red-200 animate-pulse">
                        <AlertTriangle size={18} />
                        <span className="text-sm font-bold">Bloqueo Activo: {blockedStatus.details}</span>
                    </div>
                )}
                {surchargeStatus && !blockedStatus && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg border border-amber-200">
                        <CreditCard size={18} />
                        <span className="text-sm font-bold">Recargo Activo: {surchargeStatus.details}</span>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    {/* Buttons... */}
                    <button
                        onClick={fetchStats}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-all"
                    >
                        <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Grid de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Informes Generados (Principal) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative border-l-4 border-l-teal-500">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                        <FileText size={120} />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-xl">
                            <FileText size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informes / Pedidos</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stats?.reports_generated.toLocaleString()}
                    </h3>
                    <p className="text-sm text-slate-500">
                        Informes generados
                        {stats?.limits && stats.limits.reports !== Infinity && stats.limits.reports != null && (
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IA Generativa</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stats?.tokens?.toLocaleString() || '0'}
                    </h3>
                    <p className="text-sm text-slate-500">
                        Tokens Gemini consumidos
                        {stats?.limits && stats.limits.tokens !== Infinity && stats.limits.tokens != null && (
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Almacenamiento</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatBytes(stats?.storage || 0)}
                    </h3>
                    <p className="text-sm text-slate-500">
                        Espacio en Cloudinary
                        {stats?.limits && stats.limits.storage !== Infinity && (
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RAG Search</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stats?.searches.toLocaleString()}
                    </h3>
                    <p className="text-sm text-slate-500">
                        Búsquedas vectoriales
                        {stats?.limits && stats.limits.searches !== Infinity && (
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

            {/* Smart Savings & Efficiency (Fase 25.1 Monitoring) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-teal-600 p-8 rounded-2xl text-white shadow-xl shadow-teal-500/20 relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10">
                        <Zap size={240} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <Zap className="text-amber-300" /> Ahorro Inteligente por Deduplicación
                        </h3>
                        <p className="text-indigo-100 text-sm max-w-md mb-6">
                            Gracias a la tecnología de hashing MD5, evitamos el re-procesamiento de documentos idénticos, ahorrando tokens de análisis y generación de embeddings.
                        </p>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-indigo-200 text-xs uppercase font-bold tracking-wider mb-1">Tokens Ahorrados</p>
                                <p className="text-4xl font-black">{((stats as any)?.savings || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-indigo-200 text-xs uppercase font-bold tracking-wider mb-1">Eficiencia de Ingesta</p>
                                <p className="text-4xl font-black">
                                    {stats?.tokens && stats.savings
                                        ? Math.round((stats.savings / (stats.savings + stats.tokens)) * 100)
                                        : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Search size={16} /> Búsquedas Multilingües
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-slate-600 dark:text-slate-400 text-sm">Vectores Latentes (Shadow)</span>
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">{(stats as any)?.embeddings || 0}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                            Los vectores "Shadow" permiten que buscadores en español encuentren documentos alemanes e italianos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Registro de Actividad */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <Activity size={18} className="text-teal-500" /> Registro de Actividad Reciente
                    </h3>
                    <span className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-600 px-2 py-1 rounded-full font-medium">Últimos 20 eventos</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tipo</th>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recurso</th>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {stats?.history.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-teal-900/5 transition-colors">
                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${log.tipo === 'LLM_TOKENS' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                                            log.tipo === 'STORAGE_BYTES' ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600' :
                                                log.tipo === 'SAVINGS_TOKENS' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' :
                                                    'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                                            }`}>
                                            {log.tipo}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {log.recurso}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-right text-slate-900 dark:text-white">
                                        {log.tipo === 'STORAGE_BYTES' ? formatBytes(log.valor) : log.valor.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {stats?.history && stats.history.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-slate-500 italic">
                                        No hay actividad registrada
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Gestión del Plan */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <CreditCard size={18} className="text-teal-500" /> Gestión de Suscripción
                    </h3>
                    <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-1 rounded-full font-medium">Escalabilidad Industrial</span>
                </div>
                <div className="p-8">
                    <PlanSelector
                        currentPlanSlug={stats?.planSlug}
                        onPlanChanged={() => {
                            fetchStats(); // Recargar límites y stats
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
