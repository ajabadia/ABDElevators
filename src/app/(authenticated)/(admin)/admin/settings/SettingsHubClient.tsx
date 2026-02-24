"use client";

import { useTranslations } from "next-intl";
import {
    Building2,
    MessageSquare,
    Globe,
    Bell,
    Palette,
    Users
} from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * ⚙️ Settings Hub Client Component
 */
export function SettingsHubClient() {
    const t = useTranslations("settings_hub");

    const sections: HubSection[] = [
        {
            id: "organization",
            title: t("sections.organization.title"),
            description: t("sections.organization.description"),
            href: "/admin/organizations",
            icon: Building2,
            color: "border-l-blue-500"
        },
        {
            id: "users",
            title: t("sections.users.title"),
            description: t("sections.users.description"),
            href: "/admin/users",
            icon: Users,
            color: "border-l-indigo-500"
        },
        {
            id: "prompts",
            title: t("sections.prompts.title"),
            description: t("sections.prompts.description"),
            href: "/admin/prompts",
            icon: MessageSquare,
            color: "border-l-emerald-500"
        },
        {
            id: "i18n",
            title: t("sections.i18n.title"),
            description: t("sections.i18n.description"),
            href: "/admin/settings/i18n",
            icon: Globe,
            color: "border-l-amber-500"
        },
        {
            id: "notifications",
            title: t("sections.notifications.title"),
            description: t("sections.notifications.description"),
            href: "/admin/settings/notifications",
            icon: Bell,
            color: "border-l-rose-500"
        },
        {
            id: "branding",
            title: t("sections.branding.title"),
            description: t("sections.branding.description"),
            href: "/admin/settings/branding",
            icon: Palette,
            color: "border-l-purple-500"
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
