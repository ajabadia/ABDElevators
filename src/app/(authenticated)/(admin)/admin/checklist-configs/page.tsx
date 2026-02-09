"use client";

import React from 'react';
import { ChecklistConfigList } from '@/components/admin/ChecklistConfigList';
import { LayoutGrid, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

/**
 * Page: /admin/configs-checklist
 * Dashboard principal para gestionar las reglas de negocio de los checklists.
 */
export default function ConfigsChecklistPage() {
    const t = useTranslations('admin.checklists');

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight="Dinámicos"
                subtitle={t('subtitle')}
                actions={
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        Volver al Panel
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
