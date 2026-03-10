"use client";

import { useTranslations } from "next-intl";
import { LifeBuoy, FileText, Code2, Beaker, HelpCircle } from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🆘 Help & Support Hub
 * Central point for documentation, API and support.
 */
export default function HelpHubPage() {
    const t = useTranslations('navigation.nav.help');

    const sections: HubSection[] = [
        {
            id: "support",
            title: t("support"),
            description: "Contacta con nuestro equipo técnico para resolver dudas.",
            href: "/help/support",
            icon: LifeBuoy,
            color: "border-l-primary",
            isActive: true
        },
        {
            id: "docs",
            title: t("docs"),
            description: "Manuales de usuario y guías de configuración de la plataforma.",
            href: "/help/docs", // Assuming this will exist later
            icon: FileText,
            color: "border-l-secondary"
        },
        {
            id: "api",
            title: t("api"),
            description: "Referencia para desarrolladores e integradores de sistemas.",
            href: "/help/api",
            icon: Code2,
            color: "border-l-emerald-500",
            isActive: true
        },
        {
            id: "labs",
            title: t("labs"),
            description: "Funcionalidades experimentales y zona de demostración.",
            href: "/help/labs",
            icon: Beaker,
            color: "border-l-amber-500",
            isActive: true
        }
    ];

    return (
        <HubPage
            title={t("label")}
            subtitle="Recursos de ayuda, documentación técnica y soporte directo."
            icon={<HelpCircle className="w-6 h-6 text-primary" />}
            sections={sections}
            columns={2}
        />
    );
}
