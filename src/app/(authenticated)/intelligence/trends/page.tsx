import { getErrorMessage } from '@/lib/errors-helpers';
import { getTranslations } from "next-intl/server";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { TrendingUp, Award } from "lucide-react";
import { TrendsChart, ImpactScoreCard } from "@/components/admin/intelligence/TrendsChart";
import { IntelligenceService } from "@/services/admin/IntelligenceService";
import { auth } from "@/lib/auth";
import { SupportErrorState } from "@/components/shared/SupportErrorState";

/**
 * 📈 Intelligence Trends Page
 * Analysis of patterns and technical topics discovered by the sovereign engine.
 * Phase 343: Industrial hardening & Data-driven insights.
 */
export default async function IntelligenceTrendsPage() {
    const t = await getTranslations("aiHub");
    const session = await auth();

    if (!session?.user?.tenantId) {
        return null;
    }

    try {
        const trendsData = await IntelligenceService.getTrends(session.user.tenantId);
        const totalSavings = trendsData.reduce((acc, curr) => acc + curr.savings, 0);

        return (
            <FeatureShell
                animate
                title={t("cards.trends.title")}
                subtitle={t("cards.trends.description")}
                icon={<TrendingUp className="w-6 h-6 text-indigo-500" />}
                backHref="/intelligence"
            >
                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                                    {t("trends.patterns")}
                                </h3>
                            </div>
                            <TrendsChart data={trendsData} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <ImpactScoreCard score={totalSavings} />

                        <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden shadow-xl border border-slate-800">
                            <div className="relative z-10">
                                <Award className="w-8 h-8 text-amber-400 mb-4" />
                                <h4 className="text-lg font-bold tracking-tight mb-2">Sovereign Performance</h4>
                                <p className="text-xs text-slate-400 leading-relaxed italic">
                                    "The cognitive engine has identified {trendsData.reduce((acc: number, c) => acc + c.patterns, 0)} strategic patterns in the last 30 days, optimizing cross-departmental knowledge sharing."
                                </p>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </div>
            </FeatureShell>
        );
    } catch (error: unknown) {
        return (
            <FeatureShell>
                <SupportErrorState
                    error={error as Error}
                    reset={() => { }}
                    context="Intelligence Trends Hub"
                />
            </FeatureShell>
        );
    }
}
