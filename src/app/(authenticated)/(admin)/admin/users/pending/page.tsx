"use client";

import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { useTranslations } from "next-intl";
import { InvitationsTable } from "@/components/admin/InvitationsTable";
import { UserPlus } from "lucide-react";

/**
 * 📨 Pending Invitations Module
 * Management of pending user invitations.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function UsersPendingPage() {
    const t = useTranslations("admin.users");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("invitations.title")}
                subtitle={t("invitations.desc")}
                icon={<UserPlus className="w-6 h-6 text-primary" />}
                backHref="/admin/users"
            />

            <ContentCard noPadding={true}>
                <CardHeader className="border-b border-border">
                    <CardTitle>{t("invitations.title")}</CardTitle>
                    <CardDescription>{t("invitations.desc")}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <InvitationsTable />
                </CardContent>
            </ContentCard>
        </PageContainer>
    );
}
