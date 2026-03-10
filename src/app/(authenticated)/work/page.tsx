import { getTranslations } from "next-intl/server";
import { Briefcase, ClipboardCheck, ListTodo, Gavel, Hammer, LayoutGrid, FolderOpen } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🛠️ Work Center Hub Dashboard (Phase 343.1)
 * Central navigation hub for all operational modules.
 * UI Standardized with Hub Dashboard pattern.
 * Refactored to Server Component for Security Rule #12 & Performance.
 */
export default async function WorkHub() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]);
    const t = await getTranslations("common");
    const tW = await getTranslations("work");

    const hubCards: HubSection[] = [
        {
            id: "orders",
            title: t("navigation.nav.work.orders"),
            description: tW("orders.description"),
            href: "/work/orders",
            icon: <Briefcase className="w-6 h-6" />,
            color: "border-l-blue-600",
            isActive: true
        },
        {
            id: "tasks",
            title: t("navigation.nav.work.tasks"),
            description: tW("tasks.description"),
            href: "/tasks",
            icon: <ListTodo className="w-6 h-6" />,
            color: "border-l-amber-600",
            isActive: true
        },
        {
            id: "checklists",
            title: t("navigation.nav.work.checklists"),
            description: tW("checklists.description"),
            href: "/work/checklists",
            icon: <ClipboardCheck className="w-6 h-6" />,
            color: "border-l-emerald-600",
            isActive: true
        },
        {
            id: "cases",
            title: t("navigation.nav.work.cases"),
            description: tW("cases.description"),
            href: "/work/cases",
            icon: <Gavel className="w-6 h-6" />,
            color: "border-l-purple-600",
            isActive: true
        },
        {
            id: "workshop",
            title: t("navigation.nav.work.workshop"),
            description: tW("workshop.description"),
            href: "/work/workshop",
            icon: <Hammer className="w-6 h-6" />,
            color: "border-l-rose-600",
            isActive: true
        },
        {
            id: "documents",
            title: t("navigation.nav.work.documents"),
            description: tW("nav.documents"),
            href: "/intelligence/my-docs",
            icon: <FolderOpen className="w-6 h-6" />,
            color: "border-l-slate-500",
            isActive: true
        },
    ];

    return (
        <HubPage
            title={t("navigation.nav.work.label")}
            subtitle={tW("hub.subtitle")}
            icon={<LayoutGrid className="h-10 w-10 text-primary" />}
            sections={hubCards}
            columns={3}
            commonNamespace="common"
        />
    );
}
