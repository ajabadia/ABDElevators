"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SpaceManager } from "@/components/admin/knowledge/SpaceManager";
import { Globe } from "lucide-react";

/**
 * 🌍 Knowledge Spaces Module
 * Configure context limits and access permissions for document groups.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function KnowledgeSpacesPage() {
    const t = useTranslations("knowledge_hub");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.spaces.title")}
                subtitle={t("cards.spaces.description")}
                icon={<Globe className="w-6 h-6 text-primary" />}
                backHref="/admin/knowledge"
            />

            <div className="mt-6">
                <SpaceManager />
            </div>
        </PageContainer>
    );
}
