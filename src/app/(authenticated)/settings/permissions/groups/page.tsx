import React from 'react';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db';
import { GroupHierarchyClient } from './GroupHierarchyClient';
import { FeatureShell } from '@/components/shared/FeatureShell';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * 🏛️ Permission Group Hierarchy Page (Server Component)
 * Phase 412: Zero-Waterfall fetch.
 * Standardized with FeatureShell.
 */
export default async function GroupHierarchyPage() {
    const session = await requirePermission('admin:permissions:groups', 'read');
    const t = await getTranslations('admin.guardian.groups');

    // 📡 Server-side fetch for zero waterfall (Rule 11)
    const rolesCollection = await getTenantCollection('roles', session);
    const roles = await (rolesCollection.find({}) as any).toArray();

    return (
        <FeatureShell
            title={t('title')}
            highlight={t('highlight')}
            subtitle={t('subtitle')}
            actions={
                <Button className="h-10 gap-2 font-bold shadow-primary/20 shadow-lg" aria-label={t('new_root')}>
                    <Plus className="w-4 h-4" />
                    {t('new_root')}
                </Button>
            }
        >
            <GroupHierarchyClient initialRoles={roles as any} />
        </FeatureShell>
    );
}
