"use client";

import { useTranslations } from "next-intl";
import {
    Users,
    User,
    Shield,
    CreditCard,
    Cpu,
    Building2,
    Bell
} from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * ⚙️ Settings Hub Client Component
 */
export function SettingsHubClient() {
    const t = useTranslations("settings_hub");

    const sections: HubSection[] = [
        {
            id: "profile",
            title: t("sections.profile.title"),
            description: t("sections.profile.description"),
            href: "/settings/profile",
            icon: User,
            color: "border-l-blue-500"
        },
        {
            id: "organization",
            title: t("sections.organization.title"),
            description: t("sections.organization.description"),
            href: "/settings/organization",
            icon: Building2,
            color: "border-l-indigo-500"
        },
        {
            id: "users",
            title: t("sections.users.title"),
            description: t("sections.users.description"),
            href: "/settings/users",
            icon: Users,
            color: "border-l-emerald-500"
        },
        {
            id: "security",
            title: t("sections.security.title"),
            description: t("sections.security.description"),
            href: "/settings/permissions",
            icon: Shield,
            color: "border-l-amber-500"
        },
        {
            id: "billing",
            title: t("sections.billing.title"),
            description: t("sections.billing.description"),
            href: "/settings/billing",
            icon: CreditCard,
            color: "border-l-rose-500"
        },
        {
            id: "system",
            title: t("sections.system.title"),
            description: t("sections.system.description"),
            href: "/settings/system",
            icon: Cpu,
            color: "border-l-purple-500"
        },
        {
            id: "notifications",
            title: t("sections.notifications.title"),
            description: t("sections.notifications.description"),
            href: "/settings/notifications",
            icon: Bell,
            color: "border-l-orange-500"
        }
    ];

    return (
        <HubPage
            title={t("title")}
            subtitle={t("subtitle")}
            sections={sections}
        />
    );
}
