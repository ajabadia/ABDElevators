import React from 'react';
import { ConfiguratorFull } from '@/verticals/elevators/components/configurator/ConfiguratorFull';
import { requirePermission } from '@/lib/auth';
import { FeatureShell } from "@/components/shared/FeatureShell";
import { getTranslations } from 'next-intl/server';
import { ClipboardCheck } from 'lucide-react';

/**
 * Entry point for creating a new checklist configuration.
 * Uses the dynamic configurator in "new" mode.
 * Secured with Guardian V3 (Phase 9 modernization).
 */
export default async function NewChecklistConfigPage() {
    await requirePermission('admin:checklist-configs', 'manage');
    const t = await getTranslations('admin_configurator');

    return (
        <FeatureShell
            title={t('new_config')}
            subtitle={t('subtitle')}
            icon={<ClipboardCheck className="w-6 h-6 text-primary" />}
            backHref="/work/checklists"
        >
            <div className="mt-6">
                <ConfiguratorFull isNew={true} />
            </div>
        </FeatureShell>
    );
}
