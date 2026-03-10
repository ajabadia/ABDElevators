"use client";

import { useTranslations } from "next-intl";
import { Building2, Palette, Database, Puzzle, CreditCard } from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🏢 Organizations Hub Client Component
 */
export function OrganizationsHubClient() {
    const t = useTranslations("organizations_hub");

    const sections: HubSection[] = [
        {
            id: "general",
            title: t("cards.general.title"),
            description: t("cards.general.description"),
            href: "/admin/organizations/general",
            icon: Building2,
            color: "border-l-primary"
        },
        {
            id: "branding",
            title: t("cards.branding.title"),
            description: t("cards.branding.description"),
            href: "/admin/organizations/branding",
            icon: Palette,
            color: "border-l-secondary"
        },
        {
            id: "storage",
            title: t("cards.storage.title"),
            description: t("cards.storage.description"),
            href: "/admin/organizations/storage",
            icon: Database,
            color: "border-l-accent"
        },
        {
            id: "features",
            title: t("cards.features.title"),
            description: t("cards.features.description"),
            href: "/admin/organizations/features",
            icon: Puzzle,
            color: "border-l-muted"
        },
        {
            id: "billing",
            title: t("cards.billing.title"),
            description: t("cards.billing.description"),
            href: "/admin/organizations/billing",
            icon: CreditCard,
            color: "border-l-primary/50"
        }
    ];

    return (
        <HubPage
            title={t("title")}
            subtitle={t("subtitle")}
            icon={<Building2 className="w-6 h-6 text-primary" />}
            sections={sections}
        />
    );
}
