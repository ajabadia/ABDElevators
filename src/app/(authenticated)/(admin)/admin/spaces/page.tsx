"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SpaceManager } from "@/components/admin/knowledge/SpaceManager";
import { useTranslations } from "next-intl";

/**
 * 🌌 Admin Spaces Management Page
 * Handles global configuration of knowledge hierarchies.
 */
export default function AdminSpacesPage() {
    const t = useTranslations('admin.spaces');

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
            />
            <div className="mt-6">
                <SpaceManager />
            </div>
        </PageContainer>
    );
}
