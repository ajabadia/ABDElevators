import React from 'react';
import { ChecklistConfigList } from '@/components/admin/ChecklistConfigList';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { enforcePermission } from '@/lib/guardian-guard';

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

/**
 * Page: /admin/configs-checklist (Phase 233)
 * Dashboard principal para gestionar las reglas de negocio de los checklists.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function ConfigsChecklistPage() {
    await enforcePermission('admin:checklist-configs', 'manage');
    const t = await getTranslations('admin_configurator');

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
                actions={
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        {t('backToPanel')}
                    </Link>
                }
            />

            <ChecklistConfigList />

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <ContentCard>
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{t('cards.categorization.title')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('cards.categorization.desc')}
                    </p>
                </ContentCard>
                <ContentCard>
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{t('cards.prioritization.title')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('cards.prioritization.desc')}
                    </p>
                </ContentCard>
                <ContentCard>
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">{t('cards.multi_tenant.title')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('cards.multi_tenant.desc')}
                    </p>
                </ContentCard>
            </div>
        </PageContainer>
    );
}
