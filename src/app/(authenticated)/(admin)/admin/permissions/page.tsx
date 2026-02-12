import { PermissionMatrixClient } from './PermissionMatrixClient';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.guardian.matrix.metadata');
    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function PermissionMatrixPage() {
    const t = await getTranslations('admin.guardian.matrix');

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
                actions={
                    <Button className="h-10 gap-2 font-bold shadow-primary/20 shadow-lg" aria-label={t('new_policy')}>
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        {t('new_policy')}
                    </Button>
                }
            />

            <PermissionMatrixClient />
        </PageContainer>
    );
}
