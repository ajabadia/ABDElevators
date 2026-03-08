import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import RagQualityDashboard from "@/components/admin/RagQualityDashboard";
import { Activity } from "lucide-react";
import { requirePermission } from '@/lib/auth';
/**
 * 📊 RAG Quality Module (Phase 233)
 * Monitor precision and relevance of generated responses.
 * UI Standardized with PageContainer/Header pattern.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function RagQualityPage() {
    await requirePermission('admin:ai:rag-quality', 'read');
    const t = await getTranslations("aiHub");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.rag_quality.title")}
                subtitle={t("cards.rag_quality.description")}
                icon={<Activity className="w-6 h-6 text-primary" />}
                backHref="/admin/ai"
            />

            <div className="mt-6">
                <RagQualityDashboard />
            </div>
        </PageContainer>
    );
}
