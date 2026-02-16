"use client";

import { SecurityView } from "@/components/admin/security/SecurityView";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "next-intl";

export default function SecurityPage() {
    const t = useTranslations("security_hub");

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
            />
            <SecurityView />
        </PageContainer>
    );
}
