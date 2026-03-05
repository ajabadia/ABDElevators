import React from 'react';
import { getTranslations } from 'next-intl/server';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { MyDocsClient } from '@/components/admin/knowledge/MyDocsClient';
import { FolderOpen } from 'lucide-react';
import { auth, requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';

/**
 * 📁 Admin Personal Docs (ERA 8 Canonical - Phase 233)
 * Centralized document management for admins/technicians.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function MyDocsAdminPage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
    const session = await auth();
    const t = await getTranslations('knowledge_hub');

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t('cards.my_docs.title')}
                subtitle={t('cards.my_docs.description')}
                icon={<FolderOpen className="w-6 h-6 text-primary" />}
                backHref="/admin/knowledge"
            />

            <div className="mt-6">
                <MyDocsClient userId={session?.user?.id} />
            </div>
        </PageContainer>
    );
}

