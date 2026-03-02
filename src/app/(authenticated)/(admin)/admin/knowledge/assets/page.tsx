import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { KnowledgeAssetsManager } from "@/components/admin/knowledge/KnowledgeAssetsManager";
import { FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";

/**
 * 📚 Knowledge Assets Management Module (Phase 233)
 * Unified management of knowledge assets and documents.
 * UI Standardized with PageContainer/Header pattern.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function KnowledgeAssetsPage() {
    await requireRole([UserRole.SUPER_ADMIN]);
    const t = await getTranslations("knowledge_hub");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.assets.title")}
                subtitle={t("cards.assets.description")}
                icon={<FileText className="w-6 h-6 text-primary" />}
                backHref="/admin/knowledge"
            />

            <div className="mt-6">
                <KnowledgeAssetsManager scope="all" />
            </div>
        </PageContainer>
    );
}
