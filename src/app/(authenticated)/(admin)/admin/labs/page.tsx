import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, FlaskConical, Database, Layout, ArrowRight, Activity, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { HelpButton } from "@/components/ui/help-button";

interface LabCard {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
    isActive?: boolean;
}

/**
 * 🧪 Labs & Demo Hub (Phase 248.4)
 * Centralized entry point for experiments and demo features.
 * Adheres to UI standards (Hub Dashboard pattern) and security rules.
 */
export default async function LabsHubPage() {
    await requireRole([UserRole.SUPER_ADMIN]);
    const t = await getTranslations("common.help.contexts.labs-hub");

    const labCards: LabCard[] = [
        {
            id: "real-estate-demo",
            title: "Vertical: Real Estate",
            description: "Demostración de RAG aplicado a contratos y normativas inmobiliarias.",
            href: "/admin/labs/real-estate",
            icon: <Layout className="w-6 h-6" />,
            color: "border-l-indigo-500",
            isActive: true
        },
        {
            id: "mock-data-generator",
            title: "Generador de Mock Data",
            description: "Herramienta para poblar el tenant actual con datos sintéticos para pruebas UI.",
            href: "/admin/labs/mock-generator",
            icon: <Database className="w-6 h-6" />,
            color: "border-l-amber-500",
            isActive: true
        },
        {
            id: "prompt-playground",
            title: "Prompt Sandbox",
            description: "Probar nuevos prompts de extracción sin afectar al core de producción.",
            href: "/admin/prompts",
            icon: <FlaskConical className="w-6 h-6" />,
            color: "border-l-emerald-500",
            isActive: true
        },
        {
            id: "system-metrics",
            title: "Métricas de Sistema (Beta)",
            description: "Visualización experimental de latencias y SLAs por microservicio.",
            href: "/admin/superadmin/metrics",
            icon: <Activity className="w-6 h-6" />,
            color: "border-l-rose-500",
            isActive: true
        }
    ];

    return (
        <PageContainer>
            <div className="flex items-center justify-between">
                <PageHeader
                    title={t("title")}
                    subtitle={t("content")}
                    icon={<FlaskConical className="w-6 h-6 text-primary" />}
                />
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground mr-1">¿Qué es esto?</span>
                    <HelpButton contextId="labs-hub" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                {labCards.map((card) => {
                    const CardComponent = (
                        <Card
                            className={cn(
                                "h-full border-l-4 transition-all duration-300 relative overflow-hidden",
                                card.color,
                                card.isActive
                                    ? "group cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                                    : "cursor-not-allowed opacity-60"
                            )}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg bg-muted transition-colors",
                                            card.isActive && "group-hover:bg-primary group-hover:text-primary-foreground text-primary"
                                        )}>
                                            {card.icon}
                                        </div>
                                        <CardTitle className="text-lg font-bold tracking-tight">
                                            {card.title}
                                        </CardTitle>
                                    </div>
                                    {card.isActive && (
                                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-xs leading-normal text-muted-foreground/80">
                                    {card.description}
                                </CardDescription>
                                {!card.isActive && (
                                    <span className="inline-flex items-center mt-3 text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                        🚧 En desarrollo
                                    </span>
                                )}
                            </CardContent>
                        </Card>
                    );

                    if (card.isActive) {
                        return (
                            <Link key={card.id} href={card.href} className="block group h-full">
                                {CardComponent}
                            </Link>
                        );
                    }

                    return (
                        <div key={card.id} className="block h-full block">
                            {CardComponent}
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 p-6 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-amber-500/10 text-amber-500">
                        <ShieldQuestion className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Aviso de Seguridad y Datos</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                            Las herramientas en este Hub son experimentales. El uso del Generador de Mock Data o cambios en el Playground pueden alterar la base de datos del tenant actual. No se recomienda su uso en instancias de clientes finales sin previa auditoría.
                        </p>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
