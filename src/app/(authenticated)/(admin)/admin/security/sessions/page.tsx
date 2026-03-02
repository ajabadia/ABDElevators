import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { enforcePermission } from "@/lib/guardian-guard";

/**
 * 👤 Active Sessions Module (Phase 233)
 * Management and monitoring of active user sessions.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function SecuritySessionsPage() {
    await enforcePermission('admin:security:sessions', 'read');
    const t = await getTranslations("security_hub");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.sessions.title")}
                subtitle={t("cards.sessions.description")}
                icon={<UserCog className="w-6 h-6 text-primary" />}
                backHref="/admin/security"
            />

            <div className="mt-6">
                <Card className="border-dashed border-2 bg-card/50">
                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <UserCog className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-xl">{t("sessions.title")}</CardTitle>
                        <CardDescription className="max-w-md mx-auto">
                            {t("sessions.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-8">
                        <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted px-3 py-2 rounded">
                            {t("coming_soon")}
                        </span>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
}
