import { getTranslations } from "next-intl/server";
import { Briefcase, FolderOpen, ShieldCheck, ClipboardList } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 💼 Cases Hub (Phase 7 Restoration)
 * Central navigation for cases, contracts and legal documentation.
 * UI Standardized with Hub Dashboard pattern.
 */
export default async function CasesHubPage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGENT]);
    const t = await getTranslations("cases");

    const hubCards: HubSection[] = [
        {
            id: "all_cases",
            title: t("hub.all.title") || "Todos los Casos",
            description: t("hub.all.description") || "Listado global de expedientes y contratos.",
            href: "/work/cases/all",
            icon: <Briefcase className="w-6 h-6" />,
            color: "border-l-primary"
        },
        {
            id: "active_cases",
            title: t("hub.active.title") || "Casos Activos",
            description: t("hub.active.description") || "Seguimiento de procesos en curso y validaciones pendientes.",
            href: "/work/cases/active",
            icon: <ShieldCheck className="w-6 h-6" />,
            color: "border-l-teal-500"
        },
        {
            id: "archive",
            title: t("hub.archive.title") || "Archivo Histórico",
            description: t("hub.archive.description") || "Consulta de contratos finalizados y documentación histórica.",
            href: "/work/cases/archive",
            icon: <FolderOpen className="w-6 h-6" />,
            color: "border-l-slate-400"
        },
        {
            id: "checklists",
            title: t("hub.checklists.title") || "Nexus Checklists",
            description: t("hub.checklists.description") || "Acceso directo a protocolos de verificación vinculados.",
            href: "/work/checklists",
            icon: <ClipboardList className="w-6 h-6" />,
            color: "border-l-orange-500"
        }
    ];

    return (
        <HubPage
            title={t("hub.title") || "Centro de Casos y Contratos"}
            subtitle={t("hub.subtitle") || "Gestión integral de la documentación legal y técnica de activos."}
            sections={hubCards}
            columns={2}
            commonNamespace="cases"
        />
    );
}
