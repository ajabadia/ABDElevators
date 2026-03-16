import { getTranslations } from "next-intl/server";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";

/**
 * 📈 Predictive Maintenance Module (Phase 233)
 * Pattern analysis for real-time failure prevention.
 */
export default async function PredictivePage() {
    await requireRole([UserRole.SUPER_ADMIN]);
    const t = await getTranslations("aiHub");

    return (
        <FeatureShell
            title={t("cards.predictive.title")}
            subtitle={t("cards.predictive.description")}
            icon={<LineChart className="w-6 h-6 text-primary" />}
            backHref="/admin/ai"
        >
            <div className="mt-6">
                <Card className="border-dashed border-2 bg-card/50">
                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <LineChart className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-xl">{t("cards.predictive.title")}</CardTitle>
                        <CardDescription className="max-w-md mx-auto">
                            {t("cards.predictive.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-8">
                        <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted px-3 py-2 rounded">
                            {t("coming_soon")}
                        </span>
                    </CardContent>
                </Card>
            </div>
        </FeatureShell>
    );
}
