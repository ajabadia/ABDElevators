"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitMerge } from "lucide-react";

export default function MaintenancePage() {
    const t = useTranslations("operations_hub");

    return (
        <PageContainer>
            <PageHeader
                title={t("maintenance.title")}
                subtitle={t("maintenance.subtitle")}
                backHref="/admin/operations"
            />
            <Card className="mt-6">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <GitMerge className="w-5 h-5 text-purple-600" />
                        <CardTitle>{t("maintenance.title")}</CardTitle>
                    </div>
                    <CardDescription>
                        {t("maintenance.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground border-dashed border-2 m-6 rounded-lg">
                    {t("maintenance.placeholder")}
                </CardContent>
            </Card>
        </PageContainer>
    );
}
