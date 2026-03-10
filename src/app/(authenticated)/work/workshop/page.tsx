import { getTranslations } from "next-intl/server";
import { Hammer, ClipboardList, PenTool, Box, BookOpen, LayoutGrid } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🔨 Workshop Portal Hub (Phase 343.1)
 * Optimized for manufacturing and technical operations.
 */
export default async function WorkshopHub() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]);
    const t = await getTranslations("workshop");

    const hubCards: HubSection[] = [
        {
            id: "orders",
            title: t("hub.sections.orders.title"),
            description: t("hub.sections.orders.description"),
            href: "/work/workshop/orders",
            icon: <ClipboardList className="w-6 h-6" />,
            color: "border-l-blue-600",
            isActive: true
        },
        {
            id: "new_order",
            title: t("hub.sections.new_order.title"),
            description: t("hub.sections.new_order.description"),
            href: "/work/workshop/orders/new",
            icon: <PenTool className="w-6 h-6" />,
            color: "border-l-amber-600",
            isActive: true
        },
        {
            id: "inventory",
            title: t("hub.sections.inventory.title"),
            description: t("hub.sections.inventory.description"),
            href: "/work/workshop/inventory",
            icon: <Box className="w-6 h-6" />,
            color: "border-l-emerald-600",
            isActive: true
        },
        {
            id: "protocols",
            title: t("hub.sections.protocols.title"),
            description: t("hub.sections.protocols.description"),
            href: "/work/workshop/protocols",
            icon: <BookOpen className="w-6 h-6" />,
            color: "border-l-rose-600",
            isActive: true
        },
    ];

    return (
        <HubPage
            title={t("hub.title")}
            subtitle={t("hub.subtitle")}
            icon={<Hammer className="h-10 w-10 text-primary" />}
            sections={hubCards}
            columns={2}
            commonNamespace="common"
        />
    );
}
