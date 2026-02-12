"use client";

import React from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
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
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";
import { TenantROIStats } from "@/components/admin/TenantROIStats";
import { QuickNavConnector } from "@/components/admin/QuickNavConnector";
import { StatsGrid } from "@/components/admin/StatsGrid";
import { UsageSection } from "@/components/admin/UsageSection";
import { DashboardTabs } from "@/components/admin/DashboardTabs";
import { useTranslations } from "next-intl";
import { UserRole } from "@/types/roles";

// Modular Components (Phase 105 Hygiene)
import { IndustryDistribution } from "@/components/admin/IndustryDistribution";
import { DashboardRecentActivity } from "@/components/admin/DashboardRecentActivity";

// Dynamic Imports for Heavy Tab Components (Performance Optimization - Phase 122)
const CollectiveIntelligenceDashboard = dynamic(
    () => import("@/components/admin/CollectiveIntelligenceDashboard").then(mod => ({ default: mod.CollectiveIntelligenceDashboard })),
    { loading: () => <DashboardSkeleton /> }
);

const AutomationStudio = dynamic(
    () => import("@/components/admin/AutomationStudio").then(mod => ({ default: mod.AutomationStudio })),
    { loading: () => <DashboardSkeleton /> }
);

const KnowledgeGovernance = dynamic(
    () => import("@/components/admin/KnowledgeGovernance").then(mod => ({ default: mod.KnowledgeGovernance })),
    { loading: () => <DashboardSkeleton /> }
);

const GlobalSemanticSearch = dynamic(
    () => import("@/components/shared/GlobalSemanticSearch").then(mod => ({ default: mod.GlobalSemanticSearch })),
    { loading: () => <DashboardSkeleton /> }
);

const ReliabilityStressMonitor = dynamic(
    () => import("@/components/admin/ReliabilityStressMonitor").then(mod => ({ default: mod.ReliabilityStressMonitor })),
    { loading: () => <DashboardSkeleton /> }
);

const SecurityAutoscaleMonitor = dynamic(
    () => import("@/components/admin/SecurityAutoscaleMonitor").then(mod => ({ default: mod.SecurityAutoscaleMonitor })),
    { loading: () => <DashboardSkeleton /> }
);

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
                            aria-label={t('warRoomToggle')}
                            aria-pressed={isCompact}
                            className={`p-2 rounded-lg transition-colors ${isCompact ? 'bg-teal-500/10 text-teal-500' : 'hover:bg-muted text-muted-foreground'}`}
                        >
                            {isCompact ? <Monitor size={20} aria-hidden="true" /> : <LayoutGrid size={20} aria-hidden="true" />}
                        </button>
                        <Badge variant="outline" className="gap-2 px-4 py-2 bg-background border-border text-teal-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                            <Activity size={14} className="motion-safe:animate-pulse text-teal-500" aria-hidden="true" />
                            {t('liveFeed')}
                        </Badge>
                    </div>
                }
            />

            <QuickNavConnector />


            <DashboardTabs defaultTab="overview">
                <DashboardTabs.List>
                    <DashboardTabs.Tab id="overview">
                        {t('tabs.overview')}
                    </DashboardTabs.Tab>
                    <DashboardTabs.Tab id="intelligence" icon={BrainCircuit}>
                        {t('tabs.intelligence')}
                    </DashboardTabs.Tab>
                    <DashboardTabs.Tab id="automation" icon={Zap}>
                        {t('tabs.automation')}
                    </DashboardTabs.Tab>
                    <DashboardTabs.Tab id="governance" icon={Scale}>
                        {t('tabs.governance')}
                    </DashboardTabs.Tab>
                    <DashboardTabs.Tab id="search" icon={Globe2}>
                        {t('tabs.search')}
                    </DashboardTabs.Tab>
                    <DashboardTabs.Tab id="reliability" icon={Server}>
                        {t('tabs.reliability')}
                    </DashboardTabs.Tab>
                    <DashboardTabs.Tab id="security_scale" icon={ShieldCheck}>
                        {t('tabs.security')}
                    </DashboardTabs.Tab>
                </DashboardTabs.List>

                <DashboardTabs.OverviewPanel id="overview">
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
                </DashboardTabs.OverviewPanel>

                <DashboardTabs.Panel id="intelligence" lazy>
                    <CollectiveIntelligenceDashboard />
                </DashboardTabs.Panel>

                <DashboardTabs.Panel id="automation" lazy>
                    <AutomationStudio />
                </DashboardTabs.Panel>

                <DashboardTabs.Panel id="governance" lazy>
                    <KnowledgeGovernance />
                </DashboardTabs.Panel>

                <DashboardTabs.Panel id="search" lazy>
                    <GlobalSemanticSearch />
                </DashboardTabs.Panel>

                <DashboardTabs.Panel id="reliability" lazy>
                    <ReliabilityStressMonitor />
                </DashboardTabs.Panel>

                <DashboardTabs.Panel id="security_scale" lazy>
                    <SecurityAutoscaleMonitor />
                </DashboardTabs.Panel>
            </DashboardTabs>
        </PageContainer>
    );
}
