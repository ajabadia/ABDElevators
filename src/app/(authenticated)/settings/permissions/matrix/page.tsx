import { PermissionMatrixClient } from '../PermissionMatrixClient';
import { FeatureShell } from "@/components/shared/FeatureShell";
import { Button } from '@/components/ui/button';
import { Plus, Grid3X3 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.guardian.matrix.metadata');
    return {
        title: t('title'),
        description: t('description'),
    };
}

/**
 * 🔐 Permission Matrix Module
 * Matrix view of permission policies and access controls.
 * Refactored to FeatureShell in FASE 457.
 */
export default async function PermissionMatrixPage() {
    const t = await getTranslations('admin.guardian.matrix');

    return (
        <FeatureShell
            title={t('title')}
            highlight={t('highlight')}
            subtitle={t('subtitle')}
            icon={<Grid3X3 className="w-6 h-6 text-primary" />}
            backHref="/admin/permissions"
            actions={
                <Button className="h-10 gap-2 font-bold shadow-primary/20 shadow-lg" aria-label={t('new_policy')}>
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    {t('new_policy')}
                </Button>
            }
        >
            <PermissionMatrixClient />
        </FeatureShell>
    );
}
