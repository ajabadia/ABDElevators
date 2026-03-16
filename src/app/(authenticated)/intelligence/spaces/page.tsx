import { getTranslations } from "next-intl/server";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { SpaceManager } from "@/components/admin/knowledge/SpaceManager";
import { Globe } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";

/**
 * 🌍 Knowledge Spaces Module (Phase 233)
 * Configure context limits and access permissions for document groups.
 * UI Standardized with PageContainer/Header pattern.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function KnowledgeSpacesPage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
    const t = await getTranslations("knowledge_hub");

    return (
        <FeatureShell
            title={t("cards.spaces.title")}
            subtitle={t("cards.spaces.description")}
            icon={<Globe className="w-6 h-6 text-primary" />}
            backHref="/intelligence"
        >
            <div className="mt-6">
                <SpaceManager />
            </div>
        </FeatureShell>
    );
}
