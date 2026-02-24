"use client";

import React from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useApiItem } from '@/hooks/useApiItem';
import { useApiMutation } from '@/hooks/useApiMutation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, RefreshCw } from 'lucide-react';

// Modular Widgets
import { PlatformHealthGrid } from '@/components/admin/superadmin/PlatformHealthGrid';
import { PlatformFinancialsCard } from '@/components/admin/superadmin/PlatformFinancialsCard';
import { TopTenantsCard } from '@/components/admin/superadmin/TopTenantsCard';
import { KnowledgeHealthCard } from '@/components/admin/superadmin/KnowledgeHealthCard';
import { AnomaliesWidget } from '@/components/admin/superadmin/AnomaliesWidget';
import { InfraCard } from '@/components/admin/superadmin/InfraCard';
import { EvolutionDashboard } from '@/components/admin/superadmin/EvolutionDashboard';

/**
 * 🏰 SuperAdmin Hub Client Component
 */
export function SuperAdminHubClient() {
    const t = useTranslations('admin.superadmin');

    // Core Data Fetching
    const { data: metrics, isLoading, refresh: refreshMetrics } = useApiItem<any>({ endpoint: '/api/admin/superadmin/metrics' });
    const { data: anomalyData, isLoading: isLoadingAnomalies, refresh: refreshAnomalies } = useApiItem<any>({ endpoint: '/api/admin/superadmin/anomalies' });
    const { data: evolutionData, isLoading: isLoadingEvolution, refresh: refreshEvolution } = useApiItem<any>({ endpoint: '/api/admin/superadmin/ontology/evolution' });

    const refreshAll = () => {
        refreshMetrics();
        refreshAnomalies();
        refreshEvolution();
    };

    // Actions
    const { mutate: triggerSelfHealing, isLoading: isHealing } = useApiMutation<any>({
        endpoint: '/api/cron/self-healing',
        method: 'POST',
        onSuccess: (data: any) => {
            toast.success(t('toasts.audit_success_title'), {
                description: t('toasts.audit_success_desc', { processed: data.processed, updated: data.updated })
            });
            refreshAll();
        },
        onError: (err) => {
            toast.error(t('toasts.audit_error_title'), {
                description: err || t('toasts.audit_error_desc')
            });
        }
    });

    const { mutate: runPredictiveAudit, isLoading: isAuditing } = useApiMutation<any>({
        endpoint: '/api/cron/status-check',
        method: 'POST',
        onSuccess: (data: any) => {
            toast.success(t('toasts.predictive_success_title'), {
                description: t('toasts.predictive_success_desc', { count: data.detectedCount })
            });
            refreshAll();
        },
        onError: (err) => {
            toast.error(t('toasts.predictive_error_title'), {
                description: err || t('toasts.predictive_error_desc')
            });
        }
    });

    if (isLoading) {
        return (
            <PageContainer>
                <div className="space-y-8">
                    <Skeleton className="h-12 w-64" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                    </div>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    <div className="flex gap-4">
                        <Button
                            onClick={() => runPredictiveAudit({})}
                            disabled={isAuditing}
                            variant="outline"
                            className="bg-sidebar-primary/5 border-sidebar-primary/20 hover:bg-sidebar-primary/10 text-sidebar-primary font-bold gap-2"
                        >
                            < Zap className={isAuditing ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                            {t('actions.predictive_audit')}
                        </Button>
                        <Button
                            onClick={() => triggerSelfHealing({})}
                            disabled={isHealing}
                            variant="outline"
                            className="bg-sidebar-primary/5 border-sidebar-primary/20 hover:bg-sidebar-primary/10 text-sidebar-primary font-bold gap-2"
                        >
                            <RefreshCw className={isHealing ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                            {t('actions.self_healing')}
                        </Button>
                    </div>
                }
            />

            <div className="space-y-8 mt-6">
                <PlatformHealthGrid metrics={metrics} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PlatformFinancialsCard metrics={metrics} />
                    <div className="md:col-span-2">
                        <TopTenantsCard usage={metrics?.usage} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <KnowledgeHealthCard knowledge={metrics?.knowledge} />
                    </div>
                    <AnomaliesWidget anomalyData={anomalyData} isLoadingAnomalies={isLoadingAnomalies} />
                    <InfraCard />
                </div>

                <EvolutionDashboard evolutionData={evolutionData} isLoadingEvolution={isLoadingEvolution} />
            </div>
        </PageContainer>
    );
}
