"use client";

import { useTranslations } from "next-intl";
import { Shield, Grid3X3, Users, PlayCircle, History } from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🛡️ Permissions Hub Dashboard
 * Migrated to generic HubPage component in FASE 222B.
 */
export default function PermissionsHubPage() {
    const t = useTranslations("admin.guardian");

    const sections: HubSection[] = [
        {
            id: "matrix",
            title: t("cards.matrix.title"),
            description: t("cards.matrix.description"),
            href: "/admin/permissions/matrix",
            icon: Grid3X3,
            color: "border-l-primary"
        },
        {
            id: "groups",
            title: t("cards.groups.title"),
            description: t("cards.groups.description"),
            href: "/admin/permissions/groups",
            icon: Users,
            color: "border-l-secondary"
        },
        {
            id: "simulator",
            title: t("cards.simulator.title"),
            description: t("cards.simulator.description"),
            href: "/admin/permissions/simulator",
            icon: PlayCircle,
            color: "border-l-accent"
        },
        {
            id: "audit",
            title: t("cards.audit.title"),
            description: t("cards.audit.description"),
            href: "/admin/permissions/audit",
            icon: History,
            color: "border-l-muted"
        }
    ];

    return (
        <HubPage
            title={t("console")}
            subtitle={t("governance_desc")}
            icon={<Shield className="w-6 h-6 text-primary" />}
            sections={sections}
            columns={2}
        />
    );
}
