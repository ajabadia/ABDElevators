"use client";

import React from "react";
import { useSession } from "next-auth/react";
import {
    ShieldCheck,
    Zap,
    Activity,
    AlertTriangle,
    BrainCircuit,
    Globe2,
    Server,
    Scale,
    Monitor,
    LayoutGrid
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useApiItem } from "@/hooks/useApiItem";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlobalSemanticSearch } from "@/components/shared/GlobalSemanticSearch";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { TenantROIStats } from "@/components/admin/TenantROIStats";
import { QuickNavConnector } from "@/components/admin/QuickNavConnector";
import { CollectiveIntelligenceDashboard } from "@/components/admin/CollectiveIntelligenceDashboard";
import { AutomationStudio } from "@/components/admin/AutomationStudio";
import { KnowledgeGovernance } from "@/components/admin/KnowledgeGovernance";
import { ReliabilityStressMonitor } from "@/components/admin/ReliabilityStressMonitor";
import { SecurityAutoscaleMonitor } from "@/components/admin/SecurityAutoscaleMonitor";
import { StatsGrid } from "@/components/admin/StatsGrid";
import { UsageSection } from "@/components/admin/UsageSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { UserRole } from "@/types/roles";

// Modular Components (Phase 105 Hygiene)
import { IndustryDistribution } from "@/components/admin/IndustryDistribution";
import { DashboardRecentActivity } from "@/components/admin/DashboardRecentActivity";

export default function AdminDashboardPage() {
    const t = useTranslations('admin.dashboard');
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;

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
                title={isSuperAdmin ? t('title') : t('userDashboardTitle')}
                subtitle={!isCompact ? (isSuperAdmin
                    ? t('subtitle')
                    : t('userDashboardSubtitle')) : undefined}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className={`p-2 rounded-lg transition-colors ${isCompact ? 'bg-teal-500/10 text-teal-500' : 'hover:bg-muted text-muted-foreground'}`}
                            title={t('warRoomToggle')}
                        >
                            {isCompact ? <Monitor size={20} /> : <LayoutGrid size={20} />}
                        </button>
                        <Badge variant="outline" className="gap-2 px-4 py-2 bg-background border-border text-teal-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                            <Activity size={14} className="animate-pulse text-teal-500" />
                            {t('liveFeed')}
                        </Badge>
                    </div>
                }
            />

            <QuickNavConnector />

            <Tabs defaultValue="overview" className="space-y-6 mt-8">
                <TabsList className="bg-muted p-1 rounded-2xl border border-border w-full flex justify-start overflow-x-auto">
                    <TabsTrigger value="overview" className="rounded-xl px-6">
                        {t('tabs.overview')}
                    </TabsTrigger>
                    <TabsTrigger value="intelligence" className="rounded-xl px-6 gap-2">
                        <BrainCircuit size={16} /> {t('tabs.intelligence')}
                    </TabsTrigger>
                    <TabsTrigger value="automation" className="rounded-xl px-6 gap-2">
                        <Zap size={16} /> {t('tabs.automation')}
                    </TabsTrigger>
                    <TabsTrigger value="governance" className="rounded-xl px-6 gap-2">
                        <Scale size={16} /> {t('tabs.governance')}
                    </TabsTrigger>
                    <TabsTrigger value="search" className="rounded-xl px-6 gap-2">
                        <Globe2 size={16} /> {t('tabs.search')}
                    </TabsTrigger>
                    <TabsTrigger value="reliability" className="rounded-xl px-6 gap-2">
                        <Server size={16} /> {t('tabs.reliability')}
                    </TabsTrigger>
                    <TabsTrigger value="security_scale" className="rounded-xl px-6 gap-2">
                        <ShieldCheck size={16} /> {t('tabs.security')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Tenant ROI Dashboard (Fase 24.2b) */}
                    {!isSuperAdmin && <TenantROIStats />}

                    {/* Quick Stats Grid */}
                    <StatsGrid stats={stats} isSuperAdmin={isSuperAdmin} isCompact={isCompact} />

                    {/* Consumption and Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Usage Chart */}
                        <UsageSection stats={stats} isSuperAdmin={isSuperAdmin} />

                        {/* Industries or Plan Info (Modular Card) */}
                        <IndustryDistribution
                            isSuperAdmin={isSuperAdmin}
                            industries={stats.industries}
                            tier={stats.tier}
                            t={t}
                        />
                    </div>

                    {/* Recent Activity (Modular Card) */}
                    <DashboardRecentActivity activities={stats.activities} t={t} />
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
