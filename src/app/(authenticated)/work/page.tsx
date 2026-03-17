import { getTranslations } from "next-intl/server";
import { Briefcase, ClipboardCheck, ListTodo, Gavel, Hammer, LayoutGrid, FolderOpen } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { HubPage, HubSection } from "@/components/ui/hub-page";
import { auth } from "@/lib/auth";
import { VerticalRegistryService } from "@/services/core/vertical-registry";
import { useUXStore } from "@/store/ux-store";
import { cookies } from "next/headers";

import { ChecklistStatusWidget, RiskHeatmapWidget } from "@/components/work/IndustryWidgets";

/**
 * 🛠️ Work Center Hub Dashboard (Phase 343.1)
 * Central navigation hub for all operational modules.
 * UI Standardized with Hub Dashboard pattern.
 * Refactored to Server Component for Security Rule #12 & Performance.
 */
export default async function WorkHub() {
    const session = await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TECHNICAL, UserRole.USER]);
    const t = await getTranslations("common");
    const tW = await getTranslations("work");

    // Phase 501: Adaptive UX Context
    const userRole = session.user.role as UserRole;
    const userIndustry = (session.user.industry || 'ELEVATORS') as string;
    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'es';
    const expertModeCookie = (await cookies()).get('expertMode')?.value;
    const isExpert = expertModeCookie === 'true';

    const vertical = VerticalRegistryService.getConfig(userIndustry as any);
    const entityLabel = vertical.entityLabelPlural[locale as 'es' | 'en'];

    const hubCards: HubSection[] = [
        {
            id: "orders",
            title: entityLabel || t("navigation.nav.work.orders"),
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
            isActive: isExpert || userRole === UserRole.SUPER_ADMIN,
            complexity: 'expert'
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

    const filteredCards = hubCards.filter(card => {
        if (card.complexity === 'expert' && !isExpert && userRole !== UserRole.SUPER_ADMIN) return false;
        return card.isActive;
    });

    return (
        <HubPage
            title={t("navigation.nav.work.label")}
            subtitle={tW("hub.subtitle")}
            icon={<LayoutGrid className="h-10 w-10 text-primary" />}
            sections={filteredCards}
            columns={3}
            commonNamespace="common"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userIndustry === 'LEGAL' ? (
                    <RiskHeatmapWidget />
                ) : (
                    <ChecklistStatusWidget />
                )}
            </div>
        </HubPage>
    );
}
