"use client";

import { useTranslations } from "next-intl";
import { Shield, ShieldCheck, History, UserCog, Database } from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🛡️ Security Hub Client Component
 */
export function SecurityHubClient() {
    const t = useTranslations("security_hub");

    const sections: HubSection[] = [
        {
            id: "permissions",
            title: t("cards.permissions.title"),
            description: t("cards.permissions.description"),
            href: "/admin/permissions",
            icon: ShieldCheck,
            color: "border-l-primary",
            isActive: true
        },
        {
            id: "audit",
            title: t("cards.audit.title"),
            description: t("cards.audit.description"),
            href: "/admin/security/audit",
            icon: History,
            color: "border-l-secondary",
            isActive: true
        },
        {
            id: "sessions",
            title: t("cards.sessions.title"),
            description: t("cards.sessions.description"),
            href: "/admin/security/sessions",
            icon: UserCog,
            color: "border-l-accent",
            isActive: true
        },
        {
            id: "lifecycle",
            title: t("cards.lifecycle.title"),
            description: t("cards.lifecycle.description"),
            href: "/admin/compliance",
            icon: Database,
            color: "border-l-muted",
            isActive: true
        }
    ];

    return (
        <HubPage
            title={t("title")}
            subtitle={t("subtitle")}
            icon={<Shield className="w-6 h-6 text-primary" />}
            sections={sections}
            columns={2}
        />
    );
}
