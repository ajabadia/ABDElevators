"use client";

import LogExplorer from '@/components/admin/LogExplorer';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { useTranslations } from 'next-intl';

export default function AdminLogsPage() {
    const t = useTranslations('admin.logs.page');

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />
            <ContentCard className="p-0 border-0 bg-transparent shadow-none">
                <LogExplorer />
            </ContentCard>
        </PageContainer>
    );
}
