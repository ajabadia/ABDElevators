"use client";

import React from "react";
import { useSession } from "next-auth/react";
import {
    Building2,
    FileText,
    Zap,
    ShieldCheck,
    Search,
    Activity,
    AlertTriangle,
    ArrowUpRight,
    TrendingUp,
    BrainCircuit,
    Globe2,
    Server
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { Badge } from "@/components/ui/badge";
import { TenantROIStats } from "@/components/admin/TenantROIStats";
import { useApiItem } from "@/hooks/useApiItem";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { CollectiveIntelligenceDashboard } from "@/components/admin/CollectiveIntelligenceDashboard";
import { KimiAutomationStudio } from "@/components/admin/KimiAutomationStudio";
import { KnowledgeGovernance } from "@/components/admin/KnowledgeGovernance";
import { ReliabilityStressMonitor } from "@/components/admin/ReliabilityStressMonitor";
import { SecurityAutoscaleMonitor } from "@/components/admin/SecurityAutoscaleMonitor";
import { GlobalSemanticSearch } from "@/components/shared/GlobalSemanticSearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale } from "lucide-react";

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
    limits?: any;
    tier?: string;
    planSlug?: string;
}

export default function AdminDashboardPage() {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

    // 1. Gestión de datos con hook genérico
    const { data: stats, isLoading, error } = useApiItem<GlobalStats>({
        endpoint: () => isSuperAdmin ? '/api/admin/global-stats' : '/api/admin/usage/stats',
        autoFetch: !!session,
        dataKey: isSuperAdmin ? 'global' : undefined,
        transform: (raw: any) => {
            if (!isSuperAdmin && raw.stats) {
                const s = raw.stats;
                return {
                    totalTenants: 0,
                    totalUsers: s.totalUsers || 0,
                    totalFiles: s.totalFiles || 0,
                    totalCases: s.totalCases || 0,
                    usage: {
                        tokens: s.tokens || 0,
                        storage: s.storage || 0,
                        searches: s.searches || 0,
                    },
                    industries: [],
                    activities: s.history || [],
                    limits: s.limits,
                    tier: s.tier,
                    planSlug: s.planSlug
                };
            }
            return raw;
        }
    });

    if (isLoading && !stats) return (
        <PageContainer>
            <DashboardSkeleton />
        </PageContainer>
    );
    if (error) return <div className="p-10 text-red-500 font-bold bg-red-50 rounded-2xl border border-red-200 m-6 flex items-center gap-3"><AlertTriangle /> {error}</div>;
    if (!stats) return null;

    return (
        <PageContainer>
            <PageHeader
                title={isSuperAdmin ? "Control" : "Dashboard de"}
                highlight={isSuperAdmin ? "Global" : "Organización"}
                subtitle={isSuperAdmin
                    ? "Visión consolidada de toda la infraestructura ABD RAG."
                    : "Métricas de rendimiento y consumo de tu organización."}
                actions={
                    <Badge variant="outline" className="gap-2 px-4 py-2 bg-slate-900 border-slate-700 text-teal-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                        <Activity size={14} className="animate-pulse text-teal-500" />
                        Live Feed
                    </Badge>
                }
            />

            <Tabs defaultValue="overview" className="space-y-6 mt-8">
                <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-6">
                        Vista General
                    </TabsTrigger>
                    <TabsTrigger value="intelligence" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-6 gap-2">
                        <BrainCircuit size={16} /> Inteligencia Colectiva
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-6 gap-2">
                        <Zap size={16} /> Automation Studio
                    </TabsTrigger>
                    <TabsTrigger value="governance" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-6 gap-2">
                        <Scale size={16} /> Governance
                    </TabsTrigger>
                    <TabsTrigger value="search" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-6 gap-2">
                        <Globe2 size={16} /> Semantic Network
                    </TabsTrigger>
                    <TabsTrigger value="reliability" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-6 gap-2">
                        <Server size={16} /> Resilience & CDN
                    </TabsTrigger>
                    <TabsTrigger value="security_scale" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm px-6 gap-2">
                        <ShieldCheck size={16} /> Security & Scale
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 outline-none">
                    {/* Tenant ROI Dashboard (Fase 24.2b) */}
                    {!isSuperAdmin && (
                        <div>
                            <TenantROIStats />
                        </div>
                    )}

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
                </TabsContent>

                <TabsContent value="intelligence" className="outline-none">
                    <CollectiveIntelligenceDashboard />
                </TabsContent>

                <TabsContent value="automation" className="outline-none">
                    <KimiAutomationStudio />
                </TabsContent>

                <TabsContent value="governance" className="outline-none">
                    <KnowledgeGovernance />
                </TabsContent>

                <TabsContent value="search" className="outline-none">
                    <GlobalSemanticSearch />
                </TabsContent>

                <TabsContent value="reliability" className="outline-none">
                    <ReliabilityStressMonitor />
                </TabsContent>

                <TabsContent value="security_scale" className="outline-none">
                    <SecurityAutoscaleMonitor />
                </TabsContent>
            </Tabs>

            {/* Consumption and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                {/* Usage Chart (Mock bars) */}
                <ContentCard
                    title="Consumo de IA y Almacenamiento"
                    icon={<Zap className="text-teal-500" size={18} />}
                    className="lg:col-span-2 shadow-xl shadow-slate-200/50"
                >
                    <div className="space-y-8 p-2">
                        <UsageBar
                            label="Tokens Gemini (Input/Output)"
                            value={stats.usage.tokens}
                            max={isSuperAdmin ? 10_000_000 : stats.limits?.tokens || 1_000_000}
                            format="tokens"
                            color="teal"
                        />
                        <UsageBar
                            label="Espacio en Disco (Cloudinary/S3)"
                            value={stats.usage.storage}
                            max={isSuperAdmin ? 100 * 1024 * 1024 * 1024 : stats.limits?.storage || 5 * 1024 * 1024 * 1024}
                            format="bytes"
                            color="blue"
                        />
                        <UsageBar
                            label="Búsquedas Vectoriales"
                            value={stats.usage.searches}
                            max={isSuperAdmin ? 50_000 : stats.limits?.searches || 5_000}
                            format="count"
                            color="purple"
                        />
                    </div>
                </ContentCard>

                {/* Industries or Plan Info */}
                <ContentCard
                    title={isSuperAdmin ? "Distribución por Sector" : "Estado del Plan"}
                    icon={<TrendingUp className="text-teal-500" size={18} />}
                    className="shadow-xl shadow-slate-200/50"
                >
                    {isSuperAdmin ? (
                        <div className="space-y-3">
                            {stats.industries.map((ind: any) => (
                                <div key={ind._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 transition-all cursor-default group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-teal-500 group-hover:scale-150 transition-transform" />
                                        <span className="text-xs font-black uppercase tracking-tight text-slate-500">{ind._id}</span>
                                    </div>
                                    <span className="font-mono font-black text-teal-600 tabular-nums">{ind.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 space-y-6">
                            <div className="relative inline-block px-10 py-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2rem] font-black text-2xl shadow-2xl border border-slate-700">
                                <div className="absolute -top-1 -right-1">
                                    <Badge className="bg-teal-500 text-white border-none text-[8px] font-black">ACTIVE</Badge>
                                </div>
                                {stats.tier || 'FREE'}
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Renovación automática</p>
                                <p className="text-xs text-slate-900 dark:text-white font-bold mt-1">12 de Febrero, 2026</p>
                            </div>
                            <button className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 transition-all active:scale-95">
                                Gestionar Suscripción
                            </button>
                        </div>
                    )}
                </ContentCard>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
                <ContentCard
                    title="Actividad Recierte del Sistema"
                    icon={<Activity className="text-teal-500" size={18} />}
                    noPadding
                    className="shadow-xl shadow-slate-200/50"
                >
                    <div className="divide-y divide-slate-50 dark:divide-slate-900">
                        {stats.activities && stats.activities.length > 0 ? (
                            stats.activities.map((act: any, idx: number) => (
                                <ActivityRow key={act._id || idx} activity={act} />
                            ))
                        ) : (
                            <div className="p-20 text-center flex flex-col items-center gap-4 text-slate-400">
                                <ShieldCheck size={48} className="opacity-10" />
                                <p className="text-sm font-bold tracking-tight opacity-50 uppercase tracking-[0.2em]">No hay actividad reciente registrada.</p>
                            </div>
                        )}
                    </div>
                </ContentCard>
            </div>
        </PageContainer>
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
        <Card className="border-none shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <CardContent className="p-7">
                <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-2xl ${colors[color as keyof typeof colors]} shadow-inner`}>
                        {icon}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black border-slate-100 dark:border-slate-800 text-emerald-500 bg-emerald-50/50 py-1 px-2.5 rounded-full">
                        <TrendingUp size={10} className="mr-1" /> {trend}
                    </Badge>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 opacity-70">{title}</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
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
        teal: "bg-gradient-to-r from-teal-400 to-teal-600",
        blue: "bg-gradient-to-r from-blue-400 to-blue-600",
        purple: "bg-gradient-to-r from-purple-400 to-purple-600",
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <p className="text-xs font-black uppercase tracking-tight text-slate-500">{label}</p>
                <p className="text-xs font-mono font-bold">
                    <span className="text-slate-900 dark:text-white">{formatValue(value)}</span> <span className="text-slate-400 px-1">/</span> <span className="text-slate-400">{formatValue(max)}</span>
                </p>
            </div>
            <div className="h-4 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden p-[2px] border border-slate-100 dark:border-slate-900">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={`h-full rounded-full shadow-lg ${colors[color as keyof typeof colors]}`}
                />
            </div>
        </div>
    );
}

function ActivityRow({ activity }: any) {
    const isError = activity.nivel === 'ERROR';
    const isWarn = activity.nivel === 'WARN';

    return (
        <div className="flex items-center gap-6 p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all group cursor-default">
            <div className={`p-3 rounded-2xl shadow-sm ${isError ? 'bg-rose-500/10 text-rose-500' : isWarn ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                {isError ? <AlertTriangle size={18} /> : <Activity size={18} />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal-600/60">{activity.origen}</p>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <p className="text-[10px] font-bold text-slate-400 font-mono">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-600 transition-colors">
                    {activity.mensaje}
                </p>
            </div>
            <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-100 dark:border-slate-800 text-slate-400 bg-white">
                    {activity.tenantId?.substring(0, 8) || 'SYSTEM'}
                </Badge>
                <ArrowUpRight size={18} className="text-slate-200 dark:text-slate-800 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
        </div>
    );
}

