import { getTranslations } from "next-intl/server";
import { BrainCircuit, FileText, FolderOpen, Globe } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🧠 Knowledge Hub Dashboard (Phase 133/233)
 * Central navigation hub for all knowledge management modules.
 * UI Standardized with Hub Dashboard pattern.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function KnowledgeHubPage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
    const t = await getTranslations("knowledge_hub");

    const hubCards: HubSection[] = [
        {
            id: "explorer",
            title: t("cards.explorer.title"),
            description: t("cards.explorer.description"),
            href: "/admin/knowledge/explorer",
            icon: <BrainCircuit className="w-6 h-6" />,
            color: "border-l-primary"
        },
        {
            id: "assets",
            title: t("cards.assets.title"),
            description: t("cards.assets.description"),
            href: "/admin/knowledge/assets",
            icon: <FileText className="w-6 h-6" />,
            color: "border-l-secondary"
        },
        {
            id: "my-docs",
            title: t("cards.my_docs.title"),
            description: t("cards.my_docs.description"),
            href: "/admin/knowledge/my-docs",
            icon: <FolderOpen className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: 'document_types',
            title: t('cards.document_types.title'),
            description: t('cards.document_types.description'),
            href: '/admin/document-types',
            icon: <FileText className="w-5 h-5" />,
            color: "border-l-orange-500",
            resource: 'knowledge:types',
            action: 'read'
        },
        {
            id: "spaces",
            title: t("cards.spaces.title"),
            description: t("cards.spaces.description"),
            href: "/admin/knowledge/spaces",
            icon: <Globe className="w-6 h-6" />,
            color: "border-l-muted"
        }
    ];

    return (
        <HubPage
            title={t("title")}
            subtitle={t("subtitle")}
            sections={hubCards}
            columns={2}
            commonNamespace="knowledge_hub"
        />
    );
}
