import React from 'react';
import { getTranslations } from 'next-intl/server';
import { FeatureShell } from '@/components/shared/FeatureShell';
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
        <FeatureShell
            title={t('cards.my_docs.title')}
            subtitle={t('cards.my_docs.description')}
            icon={<FolderOpen className="w-6 h-6 text-primary" />}
            backHref="/intelligence"
            animate
        >
            <div className="mt-6">
                <MyDocsClient userId={session?.user?.id || ''} />
            </div>
        </FeatureShell>
    );
}

