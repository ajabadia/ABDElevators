import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { TrendingUp } from "lucide-react";
import { TrendsChart } from "@/components/admin/intelligence/TrendsChart";

/**
 * 📈 Intelligence Trends Page
 * Analysis of patterns and technical topics discovered by the sovereign engine.
 */
export default async function IntelligenceTrendsPage() {
    const t = await getTranslations("aiHub");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.trends.title")}
                subtitle={t("cards.trends.description")}
                icon={<TrendingUp className="w-6 h-6 text-primary" />}
                backHref="/agents"
            />

            <div className="mt-6 grid gap-6">
                <TrendsChart data={[]} />
            </div>
        </PageContainer>
    );
}
