"use client";

import React from 'react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { WorkflowTaskInbox } from '@/components/admin/WorkflowTaskInbox';
import {
    CheckSquare,
    ShieldCheck,
    Users,
    History
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MetricCard } from '@/components/ui/metric-card';
import { useApiItem } from '@/hooks/useApiItem';

export default function WorkflowTasksPage() {
    const t = useTranslations('admin.workflow_tasks');
    const tStats = useTranslations('admin.workflow_tasks.stats');

    const { data: statsData, isLoading } = useApiItem<{
        pending: number;
        inReview: number;
        completedToday: number;
        avgTime: string;
    }>({
        endpoint: '/api/admin/workflow-tasks?stats=true',
        dataKey: 'stats'
    });

    const stats = statsData || {
        pending: 0,
        inReview: 0,
        completedToday: 0,
        avgTime: '...'
    };

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 mb-8">
                {/* 🎧 Phase 219: Real-time Stats Connection */}
                <MetricCard
                    title={tStats('pending')}
                    value={isLoading && !statsData ? '...' : stats.pending.toString()}
                    icon={<CheckSquare className="w-5 h-5" />}
                    variant="primary"
                />
                <MetricCard
                    title={tStats('inReview')}
                    value={isLoading && !statsData ? '...' : stats.inReview.toString()}
                    icon={<Users className="w-5 h-5" />}
                    variant="secondary"
                />
                <MetricCard
                    title={tStats('completedToday')}
                    value={isLoading && !statsData ? '...' : stats.completedToday.toString()}
                    icon={<ShieldCheck className="w-5 h-5" />}
                    variant="muted"
                />
                <MetricCard
                    title={tStats('avgTime')}
                    value={isLoading && !statsData ? '...' : stats.avgTime}
                    icon={<History className="w-5 h-5" />}
                    variant="muted"
                />
            </div>

            <WorkflowTaskInbox />
        </PageContainer>
    );
}

