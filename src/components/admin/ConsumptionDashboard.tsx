"use client";

import { useEffect, useState } from 'react';
import { Cpu, Database, Search, Activity, Zap, HardDrive, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UsageStats {
    tokens: number;
    storage: number;
    searches: number;
    api_requests: number;
    history: any[];
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

    if (loading && !stats) {
        return <div className="flex items-center justify-center p-20"><RefreshCcw className="animate-spin text-teal-600" /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header y Acción */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="text-amber-500" /> Control de Consumo
                    </h2>
                    <p className="text-slate-500 text-sm">Monitorización de recursos en tiempo real (SaaS Ready)</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-all"
                >
                    <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Grid de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        {stats?.tokens.toLocaleString()}
                    </h3>
                    <p className="text-sm text-slate-500">Tokens Gemini consumidos</p>
                    <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: '45%' }}></div>
                    </div>
                </div>

                {/* Storage */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                        <HardDrive size={120} />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-xl">
                            <Database size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Almacenamiento</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatBytes(stats?.storage || 0)}
                    </h3>
                    <p className="text-sm text-slate-500">Espacio en Cloudinary</p>
                    <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: '12%' }}></div>
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
                    <p className="text-sm text-slate-500">Búsquedas vectoriales</p>
                    <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: '65%' }}></div>
                    </div>
                </div>

                {/* API Requests */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Activity size={120} />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl">
                            <Activity size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tráfico API</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stats?.api_requests.toLocaleString()}
                    </h3>
                    <p className="text-sm text-slate-500">Llamadas totales</p>
                    <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: '30%' }}></div>
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
                            {stats?.history.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-slate-500 italic">No hay actividad registrada</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
