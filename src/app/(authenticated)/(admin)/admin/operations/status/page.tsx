"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function StatusPage() {
    const t = useTranslations("operations_hub");

    return (
        <PageContainer>
            <PageHeader
                title={t("status.title")}
                subtitle={t("status.subtitle")}
                backHref="/admin/operations"
            />
            <Card className="mt-6">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-rose-600" />
                        <CardTitle>{t("status.title")}</CardTitle>
                    </div>
                    <CardDescription>
                        {t("status.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground border-dashed border-2 m-6 rounded-lg">
                    {t("status.placeholder")}
                </CardContent>
            </Card>
        </PageContainer>
    );
}
