import { getTranslations } from "next-intl/server";
import { BarChart3, FileText, ShieldCheck, ClipboardList, Clock, BarChart2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 📊 Insights & Data Hub Dashboard (Phase 343.2)
 * Central navigation hub for all analytical and audit modules.
 * UI Standardized with Hub Dashboard pattern.
 * Refactored to Server Component for Security Rule #12 & Performance.
 */
export default async function InsightsHub() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
    const t = await getTranslations("common");
    const tI = await getTranslations("insights");

    const hubCards: HubSection[] = [
        {
            id: "analytics",
            title: t("navigation.nav.insights.analytics"),
            description: tI("analytics.description"),
            href: "/insights/analytics",
            icon: <BarChart3 className="w-6 h-6" />,
            color: "border-l-blue-500",
            isActive: true
        },
        {
            id: "reports",
            title: t("navigation.nav.insights.reports"),
            description: tI("reports.subtitle"),
            href: "/insights/reports",
            icon: <FileText className="w-6 h-6" />,
            color: "border-l-purple-500",
            isActive: true
        },
        {
            id: "scheduled",
            title: t("navigation.nav.insights.scheduled"),
            description: tI("scheduled.description"),
            href: "/insights/scheduled",
            icon: <Clock className="w-6 h-6" />,
            color: "border-l-amber-500",
            isActive: true
        },
        {
            id: "audit",
            title: t("navigation.nav.insights.audit"),
            description: tI("audit.description"),
            href: "/insights/audit",
            icon: <ShieldCheck className="w-6 h-6" />,
            color: "border-l-emerald-500",
            isActive: true
        },
        {
            id: "compliance",
            title: t("navigation.nav.insights.compliance"),
            description: tI("compliance.description"),
            href: "/insights/compliance",
            icon: <ClipboardList className="w-6 h-6" />,
            color: "border-l-rose-500",
            isActive: true
        },
    ];

    return (
        <HubPage
            title={t("navigation.nav.insights.label")}
            subtitle={tI("hub.subtitle")}
            icon={<BarChart2 className="h-10 w-10 text-primary" />}
            sections={hubCards}
            columns={3}
            commonNamespace="common"
        />
    );
}
