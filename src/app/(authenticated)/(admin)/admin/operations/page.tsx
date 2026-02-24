"use client";

import { useTranslations } from "next-intl";
import { Activity, Database, ServerCrash, GitMerge, FileText } from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🛠️ Operations Hub Page
 * Migrated to generic HubPage component in FASE 222B.
 * Maintains "isActive" enforcement for placeholder sections.
 */
export default function OperationsPage() {
    const t = useTranslations("operations_hub");

    const sections: HubSection[] = [
        {
            id: "observability",
            title: t("sections.observability.title"),
            description: t("sections.observability.description"),
            href: "/admin/operations/observability",
            icon: Activity,
            color: "border-l-blue-500",
            isActive: true
        },
        {
            id: "ingest",
            title: t("sections.ingest.title"),
            description: t("sections.ingest.description"),
            href: "/admin/operations/ingest",
            icon: Database,
            color: "border-l-emerald-500",
            isActive: true
        },
        {
            id: "logs",
            title: t("sections.logs.title"),
            description: t("sections.logs.description"),
            href: "/admin/operations/logs",
            icon: ServerCrash,
            color: "border-l-amber-500",
            isActive: true
        },
        {
            id: "maintenance",
            title: t("sections.maintenance.title"),
            description: t("sections.maintenance.description"),
            href: "/admin/operations/maintenance",
            icon: GitMerge,
            color: "border-l-purple-500",
            isActive: false
        },
        {
            id: "status",
            title: t("sections.status.title"),
            description: t("sections.status.description"),
            href: "/admin/operations/status",
            icon: FileText,
            color: "border-l-rose-500",
            isActive: true
        },
        {
            id: "trace",
            title: t("sections.trace.title"),
            description: t("sections.trace.description"),
            href: "/admin/operations/trace",
            icon: Activity,
            color: "border-l-indigo-500",
            isActive: true
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
