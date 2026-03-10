"use client";

import { useTranslations } from "next-intl";
import { Shield, ShieldCheck, History, UserCog, Database } from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🛡️ Security Hub Client Component
 */
export function SecurityHubClient() {
    const t = useTranslations("common");
    const tHub = useTranslations("security_hub");

    const sections: HubSection[] = [
        {
            id: "permissions",
            title: t("navigation.nav.settings.security_advanced.permissions"),
            description: tHub("cards.permissions.description"),
            href: "/settings/permissions",
            icon: ShieldCheck,
            color: "border-l-primary",
            isActive: true
        },
        {
            id: "audit",
            title: t("navigation.nav.settings.security_advanced.audit"),
            description: tHub("cards.audit.description"),
            href: "/settings/system/security/audit",
            icon: History,
            color: "border-l-secondary",
            isActive: true
        },
        {
            id: "sessions",
            title: t("navigation.nav.settings.security_advanced.sessions"),
            description: tHub("cards.sessions.description"),
            href: "/settings/system/security/sessions",
            icon: UserCog,
            color: "border-l-accent",
            isActive: true
        },
        {
            id: "lifecycle",
            title: t("navigation.nav.settings.security_advanced.lifecycle"),
            description: tHub("cards.lifecycle.description"),
            href: "/settings/system/security/compliance",
            icon: Database,
            color: "border-l-muted",
            isActive: true
        }
    ];

    return (
        <HubPage
            title={t("navigation.nav.settings.security_advanced.label")}
            subtitle={tHub("subtitle")}
            icon={<Shield className="w-6 h-6 text-primary" />}
            sections={sections}
            columns={2}
        />
    );
}
