import { requireRole, auth } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DocumentTypesClient } from "@/components/admin/knowledge/DocumentTypesClient";

/**
 * 📄 Document Types Configuration (Refactored Phase 345)
 * Standardized as Server Component orchestrator.
 */
export default async function DocumentTypesPage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
    const session = await auth();
    const t = await getTranslations("knowledge_hub");

    const isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.document_types.title")}
                subtitle={t("cards.document_types.description")}
                icon={<FileText className="w-6 h-6 text-primary" />}
                backHref="/intelligence"
            />

            <div className="mt-6">
                <DocumentTypesClient isSuperAdmin={isSuperAdmin} />
            </div>
        </PageContainer>
    );
}
