import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MessageSquare, Globe, Bell, Palette, Users } from "lucide-react";
import Link from "next/link";

const SETTINGS_SECTIONS = [
    {
        title: "Mi Organización",
        description: "Gestiona información de la empresa, logo y configuración regional.",
        href: "/admin/organizations",
        icon: Building2
    },
    {
        title: "Usuarios y Equipos",
        description: "Administra usuarios, roles e invitaciones.",
        href: "/admin/users",
        icon: Users
    },
    {
        title: "Prompts e IA",
        description: "Gobierno de prompts, versionado y pruebas de IA.",
        href: "/admin/prompts",
        icon: MessageSquare
    },
    {
        title: "Idioma e Internacionalización",
        description: "Configura idiomas activos y gestiona traducciones.",
        href: "/admin/settings/i18n",
        icon: Globe
    },
    {
        title: "Notificaciones",
        description: "Preferencias de alertas y canales de comunicación.",
        href: "/admin/settings/notifications",
        icon: Bell
    },
    {
        title: "Personalización (Branding)",
        description: "Ajusta la apariencia, colores y plantillas de informes.",
        href: "/admin/settings/branding",
        icon: Palette
    }
];

export default function SettingsPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Configuración"
                subtitle="Centro de administración y configuración de la plataforma."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {SETTINGS_SECTIONS.map((section) => (
                    <Link key={section.href} href={section.href} className="block group">
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 hover:border-l-primary group-hover:border-primary">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-muted rounded-md group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <section.icon className="w-5 h-5" />
                                    </div>
                                    <CardTitle className="text-lg">{section.title}</CardTitle>
                                </div>
                                <CardDescription>{section.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </PageContainer>
    );
}
