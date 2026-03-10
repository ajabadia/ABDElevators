"use client";

import React from 'react';
import { ConfiguratorFull } from '@/verticals/elevators/components/configurator/ConfiguratorFull';
import { ChecklistConfig } from '@/lib/schemas';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ClipboardCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChecklistEditorClientProps {
    config?: ChecklistConfig;
    isNew?: boolean;
}

/**
 * 📝 Checklist Editor Client Component
 * Handles the client-side interaction for the checklist configurator.
 */
export function ChecklistEditorClient({ config, isNew = false }: ChecklistEditorClientProps) {
    const t = useTranslations('admin_configurator');

    return (
        <PageContainer>
            <PageHeader
                title={config?.name || t('new_config')}
                subtitle={t('subtitle')}
                icon={<ClipboardCheck className="w-6 h-6 text-primary" />}
                backHref="/work/checklists"
            />
            <ConfiguratorFull initialConfig={config} isNew={isNew} />
        </PageContainer>
    );
}
