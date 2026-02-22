'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { KnowledgeAssetsManager } from '@/components/admin/knowledge/KnowledgeAssetsManager';
import { Shield, FolderOpen } from 'lucide-react';

/**
 * 📁 My Documents / Personal Space (ERA 6)
 * Centralized document management for the authenticated user.
 * Standardized using KnowledgeAssetsManager with 'user' scope.
 */
export default function MyDocumentsPage() {
    const t = useTranslations('knowledge_hub');
    const { data: session } = useSession();

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t('cards.my_docs.title')}
                subtitle={t('cards.my_docs.description')}
                icon={<FolderOpen className="w-6 h-6 text-primary" />}
                backHref="/admin/knowledge"
            />

            <div className="mt-6">
                <KnowledgeAssetsManager scope="user" userId={session?.user?.id} />
            </div>
        </PageContainer>
    );
}
