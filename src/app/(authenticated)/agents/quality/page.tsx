import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { QualityDashboard } from "@/components/admin/quality/QualityDashboard";
import { BarChart3 } from "lucide-react";
import { auth, requirePermission } from '@/lib/auth';
import { QualityInsightsService } from "@/services/admin/quality-insights-service";
import { redirect } from "next/navigation";

/**
 * 📊 Quality Insights Page (Phase 308)
 * Product-centric dashboard for RAG performance analysis.
 */
export default async function QualityInsightsPage() {
    await requirePermission('admin:ai:quality', 'read');
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;

    if (!tenantId) {
        redirect("/admin/ai");
    }

    const t = await getTranslations("aiHub");

    // Fetch data server-side for initial render
    const [stats, manuals] = await Promise.all([
        QualityInsightsService.getGlobalQuality({ tenantId }),
        QualityInsightsService.getManualInsights(tenantId)
    ]);

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.quality_insights.title")}
                subtitle={t("cards.quality_insights.description")}
                icon={<BarChart3 className="w-6 h-6 text-primary" />}
                backHref="/agents"
            />

            <div className="mt-6">
                <QualityDashboard stats={stats as any} manuals={manuals as any} />
            </div>
        </PageContainer>
    );
}
