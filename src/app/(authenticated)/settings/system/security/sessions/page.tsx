import { getTranslations } from "next-intl/server";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from '@/lib/auth';

/**
 * 👤 Active Sessions Module (Phase 233)
 * Management and monitoring of active user sessions.
 * Standardized with FeatureShell.
 */
export default async function SecuritySessionsPage() {
    await requirePermission('admin:security:sessions', 'read');
    const t = await getTranslations("security_hub");

    return (
        <FeatureShell
            title={t("cards.sessions.title")}
            subtitle={t("cards.sessions.description")}
            icon={<UserCog className="w-6 h-6 text-primary" />}
            backHref="/admin/security"
        >
            <div className="mt-8">
                <Card className="border-dashed border-2 bg-card/50 rounded-3xl overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-800 shadow-sm">
                    <CardHeader className="text-center pt-12 pb-6">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center shadow-inner">
                            <UserCog className="w-10 h-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">{t("sessions.title")}</CardTitle>
                        <CardDescription className="max-w-md mx-auto font-medium">
                            {t("sessions.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-12">
                        <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-4 py-2 rounded-xl">
                            {t("coming_soon")}
                        </span>
                    </CardContent>
                </Card>
            </div>
        </FeatureShell>
    );
}
