import { getTranslations } from "next-intl/server";
import { FeatureShell } from "@/components/shared/FeatureShell";
import RagQualityDashboard from "@/components/admin/RagQualityDashboard";
import { Activity } from "lucide-react";
import { requirePermission } from '@/lib/auth';

/**
 * 📊 RAG Quality Module (Phase 233)
 * Monitor precision and relevance of generated responses.
 */
export default async function RagQualityPage() {
    await requirePermission('admin:ai:rag-quality', 'read');
    const t = await getTranslations("aiHub");

    return (
        <FeatureShell
            title={t("cards.rag_quality.title")}
            subtitle={t("cards.rag_quality.description")}
            icon={<Activity className="w-6 h-6 text-primary" />}
            backHref="/admin/ai"
        >
            <div className="mt-6">
                <RagQualityDashboard />
            </div>
        </FeatureShell>
    );
}
