"use client";

import { useTranslations } from "next-intl";
import { LifeBuoy, FileText, Code2, Beaker, HelpCircle } from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🆘 Help & Support Hub
 * Central point for documentation, API and support.
 */
export default function HelpHubPage() {
    const t = useTranslations('common.navigation.nav.help');
    const tBase = useTranslations('common.help');

    const sections: HubSection[] = [
        {
            id: "support",
            title: t("support"),
            description: "Contacta con nuestro equipo técnico para resolver dudas o reportar incidencias.",
            href: "/support",
            icon: LifeBuoy,
            color: "border-l-indigo-500",
            isActive: true
        },
        {
            id: "docs",
            title: t("docs"),
            description: "Manuales de usuario, guías de configuración y mejores prácticas de la plataforma.",
            href: "/help/docs",
            icon: FileText,
            color: "border-l-slate-500",
            isActive: true
        },
        {
            id: "api",
            title: t("api"),
            description: "Referencia técnica interactiva para desarrolladores e integradores de sistemas.",
            href: "/help/api",
            icon: Code2,
            color: "border-l-emerald-500",
            isActive: true
        },
        {
            id: "labs",
            title: t("labs.label"),
            description: "Explora funcionalidades experimentales y nuevas verticales industriales en desarrollo.",
            href: "/help/labs",
            icon: Beaker,
            color: "border-l-amber-500",
            isActive: true
        }
    ];

    return (
        <HubPage
            title={t("label")}
            subtitle={tBase("subtitle") || "Recursos de ayuda, documentación técnica y soporte directo."}
            icon={<HelpCircle className="w-6 h-6 text-indigo-500" />}
            sections={sections}
            columns={2}
            className="font-outfit italic uppercase tracking-tight"
        />
    );
}
