import { getTranslations } from "next-intl/server";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { QualityDashboard } from "@/components/admin/quality/QualityDashboard";
import { BarChart3 } from "lucide-react";
import { requireAuth, requirePermission } from '@/lib/auth';
import { QualityInsightsService, type ManualMetric } from "@/services/admin/quality-insights-service";

/**
 * 📊 Quality Insights Page (Phase 308)
 * Product-centric dashboard for RAG performance analysis.
 */
export default async function QualityInsightsPage() {
    await requirePermission('admin:ai:quality', 'read');
    const session = await requireAuth();
    const tenantId = session.user.tenantId;

    const t = await getTranslations("aiHub");

    // Fetch data server-side for initial render
    const [stats, manuals] = await Promise.all([
        QualityInsightsService.getGlobalQuality({ tenantId }),
        QualityInsightsService.getManualInsights(tenantId)
    ]);

    return (
        <FeatureShell
            title={t("cards.quality_insights.title")}
            subtitle={t("cards.quality_insights.description")}
            icon={<BarChart3 className="w-6 h-6 text-primary" />}
            backHref="/agents"
        >
            <div className="mt-6">
                <QualityDashboard stats={stats} manuals={manuals as ManualMetric[]} />
            </div>
        </FeatureShell>
    );
}
