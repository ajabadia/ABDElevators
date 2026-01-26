"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    Users,
    Building2,
    FileText,
    Database,
    Zap,
    ShieldCheck,
    Search,
    Activity,
    AlertTriangle,
    ArrowUpRight,
    TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GlobalStats {
    totalTenants: number;
    totalUsers: number;
    totalFiles: number;
    totalCases: number;
    usage: {
        tokens: number;
        storage: number;
        searches: number;
    };
    industries: Array<{ _id: string; count: number }>;
    activities: any[];
}

export default function AdminDashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const endpoint = isSuperAdmin
                    ? '/api/admin/global-stats'
                    : '/api/admin/usage/stats';

                const res = await fetch(endpoint);
                const data = await res.json();

                if (data.success) {
                    if (isSuperAdmin) {
                        setStats(data.global);
                    } else {
                        // Normalizar datos de Tenant para que coincidan con la estructura esperada (usage nested)
                        const tenantStats = data.stats;
                        const normalizedStats: any = {
                            totalTenants: 0,
                            totalUsers: 0, // Se podría obtener de otro lado si hace falta
                            totalFiles: 0,
                            totalCases: 0,
                            usage: {
                                tokens: tenantStats.tokens || 0,
                                storage: tenantStats.storage || 0,
                                searches: tenantStats.searches || 0,
                            },
                            industries: [],
                            activities: tenantStats.history || [],
                            limits: tenantStats.limits,
                            tier: tenantStats.tier,
                            planSlug: tenantStats.planSlug
                        };
                        setStats(normalizedStats);
                    }
                } else {
                    setError(data.message || "Error al cargar estadísticas");
                }
            } catch (err) {
                console.error(err);
                setError("Error de conexión");
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchStats();
        }
    }, [session, isSuperAdmin]);

    if (loading) return <DashboardSkeleton />;
    if (error) return <div className="p-10 text-red-500">{error}</div>;
    if (!stats) return null;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {isSuperAdmin ? "Global Control Center" : "Dashboard de Organización"}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {isSuperAdmin
                            ? "Visión consolidada de toda la infraestructura ABD RAG."
                            : "Métricas de rendimiento y consumo de tu tenant."}
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full text-xs font-bold uppercase tracking-widest border border-teal-500/20">
                    <Activity size={14} className="animate-pulse" />
                    En tiempo real
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={isSuperAdmin ? "Total Tenants" : "Usuarios Activos"}
                    value={isSuperAdmin ? stats.totalTenants : (stats as any).totalUsers || 0}
                    icon={<Building2 className="text-blue-500" />}
                    trend="+12%"
                    color="blue"
                />
                <StatCard
                    title="Documentos"
                    value={stats.totalFiles}
                    icon={<FileText className="text-amber-500" />}
                    trend="+5.4%"
                    color="amber"
                />
                <StatCard
                    title="Pedidos / Casos"
                    value={stats.totalCases}
                    icon={<ShieldCheck className="text-emerald-500" />}
                    trend="+18%"
                    color="emerald"
                />
                <StatCard
                    title="IA Searches"
                    value={stats.usage.searches}
                    icon={<Search className="text-purple-500" />}
                    trend="+24%"
                    color="purple"
                />
            </div>

            {/* Consumption and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Usage Chart (Mock bars) */}
                <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-900">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Zap className="text-teal-500" size={18} />
                            Consumo de IA y Almacenamiento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-8">
                            <UsageBar
                                label="Tokens Gemini (Input/Output)"
                                value={stats.usage.tokens}
                                max={isSuperAdmin ? 10_000_000 : (stats as any).limits?.tokens || 1_000_000}
                                format="tokens"
                                color="teal"
                            />
                            <UsageBar
                                label="Espacio en Disco (Cloudinary/S3)"
                                value={stats.usage.storage}
                                max={isSuperAdmin ? 100 * 1024 * 1024 * 1024 : (stats as any).limits?.storage || 5 * 1024 * 1024 * 1024}
                                format="bytes"
                                color="blue"
                            />
                            <UsageBar
                                label="Búsquedas Vectoriales"
                                value={stats.usage.searches}
                                max={isSuperAdmin ? 50_000 : (stats as any).limits?.searches || 5_000}
                                format="count"
                                color="purple"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Industries or Plan Info */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-900">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="text-teal-500" size={18} />
                            {isSuperAdmin ? "Distribución por Sector" : "Estado del Plan"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {isSuperAdmin ? (
                            <div className="space-y-4">
                                {stats.industries.map((ind: any) => (
                                    <div key={ind._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-teal-500" />
                                            <span className="text-sm font-bold uppercase tracking-tight">{ind._id}</span>
                                        </div>
                                        <span className="font-mono font-bold text-teal-600">{ind.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 space-y-4">
                                <div className="inline-block px-4 py-2 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl font-black text-xl shadow-lg">
                                    {(stats as any).tier || 'FREE'}
                                </div>
                                <p className="text-sm text-slate-500">Renovación automática en 12 días</p>
                                <button className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                                    Gestionar Suscripción
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-900">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Activity className="text-teal-500" size={18} />
                        Actividad Reciente del Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-900">
                        {stats.activities.length > 0 ? (
                            stats.activities.map((act: any, idx: number) => (
                                <ActivityRow key={act._id || idx} activity={act} />
                            ))
                        ) : (
                            <div className="p-10 text-center text-slate-500 italic">No hay actividad reciente registrada.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon, trend, color }: any) {
    const colors = {
        blue: "bg-blue-500/10 text-blue-500",
        amber: "bg-amber-500/10 text-amber-500",
        emerald: "bg-emerald-500/10 text-emerald-500",
        purple: "bg-purple-500/10 text-purple-500",
        teal: "bg-teal-500/10 text-teal-500",
    };

    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl ${colors[color as keyof typeof colors]}`}>
                        {icon}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors px-2 py-1 rounded-full text-slate-400 uppercase tracking-tighter">
                        <TrendingUp size={10} />
                        {trend}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{title}</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function UsageBar({ label, value, max, format, color }: any) {
    const percentage = Math.min((value / max) * 100, 100);

    const formatValue = (v: number) => {
        if (format === 'tokens') return `${(v / 1000).toFixed(1)}k`;
        if (format === 'bytes') return `${(v / (1024 * 1024)).toFixed(1)}MB`;
        return v.toLocaleString();
    };

    const colors = {
        teal: "bg-teal-500",
        blue: "bg-blue-500",
        purple: "bg-purple-500",
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</p>
                <p className="text-xs font-mono font-bold text-slate-500">
                    <span className="text-slate-900 dark:text-white">{formatValue(value)}</span> / {formatValue(max)}
                </p>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden p-0.5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full shadow-inner ${colors[color as keyof typeof colors]}`}
                />
            </div>
        </div>
    );
}

function ActivityRow({ activity }: any) {
    const isError = activity.nivel === 'ERROR';
    const isWarn = activity.nivel === 'WARN';

    return (
        <div className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
            <div className={`p-2 rounded-lg ${isError ? 'bg-red-500/10 text-red-500' : isWarn ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'}`}>
                {isError ? <AlertTriangle size={16} /> : <Activity size={16} />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-xs font-black uppercase tracking-tighter text-slate-400">{activity.origen}</p>
                    <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                    <p className="text-[10px] font-bold text-slate-500">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-teal-500 transition-colors">
                    {activity.mensaje}
                </p>
            </div>
            <ArrowUpRight size={16} className="text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-8 w-32 rounded-full" />
            </div>
            <div className="grid grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
            </div>
            <div className="grid grid-cols-3 gap-8">
                <Skeleton className="col-span-2 h-96 rounded-3xl" />
                <Skeleton className="h-96 rounded-3xl" />
            </div>
        </div>
    );
}
