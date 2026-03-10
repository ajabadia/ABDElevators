"use client";

import { useTranslations } from "next-intl";
import {
    Globe,
    Bell,
    Settings,
    ShieldAlert,
    Terminal,
    Activity
} from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🛠️ System Settings Hub Client Component
 * Provides a unified entry point for low-level system configurations.
 */
export function SystemHubClient() {
    const t = useTranslations("settings.system_hub");

    const sections: HubSection[] = [
        {
            id: "i18n",
            title: t("sections.i18n.title"),
            description: t("sections.i18n.description"),
            href: "/settings/system/i18n",
            icon: Globe,
            color: "border-l-amber-500",
            resource: "admin:i18n",
            action: "manage"
        },
        {
            id: "notifications",
            title: t("sections.notifications.title"),
            description: t("sections.notifications.description"),
            href: "/settings/system/notifications",
            icon: Bell,
            color: "border-l-rose-500",
            resource: "admin:notifications",
            action: "manage"
        },
        {
            id: "operations",
            title: t("sections.operations.title"),
            description: t("sections.operations.description"),
            href: "/settings/system/operations",
            icon: Activity,
            color: "border-l-emerald-500",
            resource: "admin:operations",
            action: "read"
        },
        {
            id: "security",
            title: t("sections.security.title"),
            description: t("sections.security.description"),
            href: "/settings/system/security",
            icon: ShieldAlert,
            color: "border-l-destructive",
            resource: "admin:security",
            action: "access"
        },
        {
            id: "superadmin",
            title: t("sections.superadmin.title"),
            description: t("sections.superadmin.description"),
            href: "/settings/system/superadmin",
            icon: Terminal,
            color: "border-l-slate-600",
            resource: "admin:superadmin",
            action: "access"
        }
    ];

    return (
        <HubPage
            title={t("title")}
            subtitle={t("subtitle")}
            sections={sections}
            icon={<Settings className="w-6 h-6 text-primary" />}
        />
    );
}
