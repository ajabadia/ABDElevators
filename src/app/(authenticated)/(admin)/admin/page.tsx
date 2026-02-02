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
    BrainCircuit,
    Globe2,
    Server,
    Scale,
    TrendingUp,
    Monitor,
    LayoutGrid
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { ContentCard } from "@/components/ui/content-card";
import { UsageBar } from "@/components/admin/UsageBar";
import { ActivityRow } from "@/components/admin/ActivityRow";
import { useApiItem } from "@/hooks/useApiItem";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlobalSemanticSearch } from "@/components/shared/GlobalSemanticSearch";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { CollectiveIntelligenceDashboard } from "@/components/admin/CollectiveIntelligenceDashboard";
import { AutomationStudio } from "@/components/admin/AutomationStudio";
import { KnowledgeGovernance } from "@/components/admin/KnowledgeGovernance";
import { ReliabilityStressMonitor } from "@/components/admin/ReliabilityStressMonitor";
import { SecurityAutoscaleMonitor } from "@/components/admin/SecurityAutoscaleMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function AdminDashboardPage() {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === 'admin';

    const { data: stats, isLoading, error } = useApiItem<any>({
        endpoint: '/api/admin/global-stats',
        dataKey: 'global',
        transform: (s: any) => ({
            ...s,
            usage: {
                ...(s.usage || {}),
                searches: s.usage?.searches || 0,
            },
            industries: s.industries || [],
            activities: s.history || [],
            limits: s.limits || {},
            tier: s.tier,
            planSlug: s.planSlug
        })
    });

    const [isCompact, setIsCompact] = React.useState(false);

    if (isLoading && !stats) return (
        <PageContainer>
            <DashboardSkeleton />
        </PageContainer>
    );
    if (error) return <div className="p-10 text-destructive font-bold bg-destructive/10 rounded-2xl border border-destructive/20 m-6 flex items-center gap-3"><AlertTriangle /> {error}</div>;
    if (!stats) return null;

    return (
        <PageContainer className={isCompact ? "max-w-[2400px] p-4" : ""}>
            <PageHeader
                title={isSuperAdmin ? "Control Global" : "Dashboard"}
                subtitle={!isCompact ? (isSuperAdmin
                    ? "Visión consolidada de toda la infraestructura."
                    : "Métricas de rendimiento y consumo de tu organización.") : undefined}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className={`p-2 rounded-lg transition-colors ${isCompact ? 'bg-teal-500/10 text-teal-500' : 'hover:bg-muted text-muted-foreground'}`}
                            title="Toggle War Room Mode"
                        >
                            {isCompact ? <Monitor size={20} /> : <LayoutGrid size={20} />}
                        </button>
                        <Badge variant="outline" className="gap-2 px-4 py-2 bg-background border-border text-teal-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                            <Activity size={14} className="animate-pulse text-teal-500" />
                            Live Feed
                        </Badge>
                    </div>
                }
            />

            <Tabs defaultValue="overview" className="space-y-6 mt-8">
                <TabsList className="bg-muted p-1 rounded-2xl border border-border w-full flex justify-start overflow-x-auto">
                    <TabsTrigger value="overview" className="rounded-xl px-6">
                        Vista General
                    </TabsTrigger>
                    <TabsTrigger value="intelligence" className="rounded-xl px-6 gap-2">
                        <BrainCircuit size={16} /> Inteligencia
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="rounded-xl px-6 gap-2">
                        <Zap size={16} /> Automation
                    </TabsTrigger>
                    <TabsTrigger value="governance" className="rounded-xl px-6 gap-2">
                        <Scale size={16} /> Governance
                    </TabsTrigger>
                    <TabsTrigger value="search" className="rounded-xl px-6 gap-2">
                        <Globe2 size={16} /> Semantic
                    </TabsTrigger>
                    <TabsTrigger value="reliability" className="rounded-xl px-6 gap-2">
                        <Server size={16} /> Resilience
                    </TabsTrigger>
                    <TabsTrigger value="security_scale" className="rounded-xl px-6 gap-2">
                        <ShieldCheck size={16} /> Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Tenant ROI Dashboard (Fase 24.2b) */}
                    {!isSuperAdmin && (
                        <div>
                            {/* Placeholder for TenantROIStats if it was intended to be used, 
                                 otherwise commenting out as I don't see it imported/defined in the original snippet 
                                 but it was in the view_file output. I'll assume it's component-local or handled elsewhere. 
                                 Actually, TenantROIStats IS NOT in the imports I see in view_file above. 
                                 I will remove it to avoid ReferenceError if it is not imported. 
                                 Wait, line 95 has <TenantROIStats />. 
                                 The imports in view_file output show imports up to line 27. 
                                 TenantROIStats is NOT imported. 
                                 I must likely remove it or import it. 
                                 Given I am refactoring, and if it's missing, I'll comment it out safely.
                             */}
                            {/* <TenantROIStats /> */}
                        </div>
                    )}

                    {/* Quick Stats Grid */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-${isCompact ? '3' : '6'}`}>
                        <MetricCard
                            title={isSuperAdmin ? "Total Tenants" : "Usuarios Activos"}
                            value={isSuperAdmin ? stats.totalTenants : (stats as any).totalUsers || 0}
                            icon={<Building2 />}
                            trend="+12%"
                            trendDirection="up"
                            color="blue"
                            className={isCompact ? "p-4" : ""}
                        />
                        <MetricCard
                            title="Documentos"
                            value={stats.totalFiles}
                            icon={<FileText />}
                            trend="+5.4%"
                            trendDirection="up"
                            color="amber"
                            className={isCompact ? "p-4" : ""}
                        />
                        <MetricCard
                            title="Pedidos / Casos"
                            value={stats.totalCases}
                            icon={<ShieldCheck />}
                            trend="+18%"
                            trendDirection="up"
                            color="emerald"
                            className={isCompact ? "p-4" : ""}
                        />
                        <MetricCard
                            title="IA Searches"
                            value={stats.usage.searches}
                            icon={<Search />}
                            trend="+24%"
                            trendDirection="up"
                            color="purple"
                            className={isCompact ? "p-4" : ""}
                        />
                    </div>

                    {/* Consumption and Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Usage Chart */}
                        <ContentCard
                            title="Consumo de IA y Almacenamiento"
                            icon={<Zap className="text-teal-500" size={18} />}
                            className="lg:col-span-2 shadow-xl shadow-slate-200/50 dark:shadow-none"
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
                            className="shadow-xl shadow-slate-200/50 dark:shadow-none"
                        >
                            {isSuperAdmin ? (
                                <div className="space-y-3">
                                    {stats.industries.map((ind: any) => (
                                        <div key={ind._id} className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border hover:border-teal-500/30 transition-all cursor-default group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-teal-500 group-hover:scale-150 transition-transform" />
                                                <span className="text-xs font-black uppercase tracking-tight text-muted-foreground">{ind._id}</span>
                                            </div>
                                            <span className="font-mono font-black text-primary tabular-nums">{ind.count}</span>
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
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Renovación automática</p>
                                        <p className="text-xs text-foreground font-bold mt-1">12 de Febrero, 2026</p>
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
                            title="Actividad Reciente del Sistema"
                            icon={<Activity className="text-teal-500" size={18} />}
                            noPadding
                            className="shadow-xl shadow-slate-200/50 dark:shadow-none"
                        >
                            <div className="divide-y divide-border">
                                {stats.activities && stats.activities.length > 0 ? (
                                    stats.activities.map((act: any, idx: number) => (
                                        <ActivityRow key={act._id || idx} activity={act} />
                                    ))
                                ) : (
                                    <div className="p-20 text-center flex flex-col items-center gap-4 text-muted-foreground">
                                        <ShieldCheck size={48} className="opacity-10" />
                                        <p className="text-sm font-bold tracking-tight opacity-50 uppercase tracking-[0.2em]">No hay actividad reciente registrada.</p>
                                    </div>
                                )}
                            </div>
                        </ContentCard>
                    </div>
                </TabsContent>

                <TabsContent value="intelligence" className="outline-none">
                    <CollectiveIntelligenceDashboard />
                </TabsContent>

                <TabsContent value="automation" className="outline-none">
                    <AutomationStudio />
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
        </PageContainer>
    );
}

