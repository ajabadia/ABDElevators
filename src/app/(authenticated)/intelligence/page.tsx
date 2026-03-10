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
    const t = await getTranslations("common");
    const tK = await getTranslations("knowledge_hub");

    const hubCards: HubSection[] = [
        {
            id: "explorer",
            title: t("navigation.nav.intelligence.explorer"),
            description: tK("cards.explorer.description"),
            href: "/intelligence/explorer",
            icon: <BrainCircuit className="w-6 h-6" />,
            color: "border-l-primary"
        },
        {
            id: "assets",
            title: t("navigation.nav.intelligence.assets"),
            description: tK("cards.assets.description"),
            href: "/intelligence/assets",
            icon: <FileText className="w-6 h-6" />,
            color: "border-l-secondary"
        },
        {
            id: "my_docs",
            title: t("navigation.nav.intelligence.my_docs"),
            description: tK("cards.my_docs.description"),
            href: "/intelligence/my-docs",
            icon: <FolderOpen className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: 'document_types',
            title: t('navigation.nav.intelligence.document_types'),
            description: tK('cards.document_types.description'),
            href: '/intelligence/document-types',
            icon: <FileText className="w-5 h-5" />,
            color: "border-l-orange-500",
            resource: 'knowledge:types',
            action: 'read'
        },
        {
            id: "spaces",
            title: t("navigation.nav.intelligence.spaces"),
            description: tK("cards.spaces.description"),
            href: "/intelligence/spaces",
            icon: <Globe className="w-6 h-6" />,
            color: "border-l-muted"
        }
    ];

    return (
        <HubPage
            title={t("navigation.nav.intelligence.label")}
            subtitle={tK("subtitle")}
            sections={hubCards}
            columns={2}
            commonNamespace="common"
        />
    );
}
