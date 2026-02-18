"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { AuditLogTable } from "@/components/admin/security/AuditLogTable";
import { History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 🔍 Security Audit Module
 * Audit trail logs and security events tracking.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function SecurityAuditPage() {
    const t = useTranslations("security_hub");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.audit.title")}
                subtitle={t("cards.audit.description")}
                icon={<History className="w-6 h-6 text-primary" />}
                backHref="/admin/security"
            />

            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("audit.title")}</CardTitle>
                        <CardDescription>
                            {t("audit.description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AuditLogTable />
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
}
