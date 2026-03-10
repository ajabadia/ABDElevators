"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

/**
 * 🔔 Notifications Settings - Client View
 */
export default function NotificationsClient() {
    const t = useTranslations("settings_hub.sections.notifications");

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                subtitle={t("description")}
                backHref="/settings"
            />
            <Card className="h-[400px] flex items-center justify-center border-dashed">
                <CardContent className="text-muted-foreground">
                    Próximamente: Panel de configuración de notificaciones avanzado.
                </CardContent>
            </Card>
        </PageContainer>
    );
}
