"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { FeaturesTab } from "@/components/admin/organizations/FeaturesTab";
import { Puzzle } from "lucide-react";
import { useTenantConfigStore } from "@/store/tenant-config-store";

/**
 * 🧩 Features Module
 * Available modules and features: RAG Search, Gemini Analysis, etc.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function OrganizationsFeaturesPage() {
    const t = useTranslations("admin.organizations.page");
    const { config } = useTenantConfigStore();

    if (!config) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                icon={<Puzzle className="w-6 h-6 text-primary" />}
                backHref="/admin/organizations"
            />

            <div className="mt-6">
                <FeaturesTab config={config} />
            </div>
        </PageContainer>
    );
}
