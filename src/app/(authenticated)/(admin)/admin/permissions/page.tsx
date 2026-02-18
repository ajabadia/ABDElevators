"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Grid3X3, Users, PlayCircle, History, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HubCard {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
}

/**
 * 🛡️ Permissions Hub Dashboard (Phase 133)
 * Central navigation hub for all permission and governance modules.
 * UI Standardized with Hub Dashboard pattern.
 */
export default function PermissionsHubPage() {
    const router = useRouter();
    const t = useTranslations("admin.guardian");

    const hubCards: HubCard[] = [
        {
            id: "matrix",
            title: t("cards.matrix.title"),
            description: t("cards.matrix.description"),
            href: "/admin/permissions/matrix",
            icon: <Grid3X3 className="w-6 h-6" />,
            color: "border-l-primary"
        },
        {
            id: "groups",
            title: t("cards.groups.title"),
            description: t("cards.groups.description"),
            href: "/admin/permissions/groups",
            icon: <Users className="w-6 h-6" />,
            color: "border-l-secondary"
        },
        {
            id: "simulator",
            title: t("cards.simulator.title"),
            description: t("cards.simulator.description"),
            href: "/admin/permissions/simulator",
            icon: <PlayCircle className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: "audit",
            title: t("cards.audit.title"),
            description: t("cards.audit.description"),
            href: "/admin/permissions/audit",
            icon: <History className="w-6 h-6" />,
            color: "border-l-muted"
        }
    ];

    return (
        <PageContainer className="animate-in fade-in duration-500">
            <PageHeader
                title={t("console")}
                subtitle={t("governance_desc")}
                icon={<Shield className="w-6 h-6 text-primary" />}
            />

            <div className="grid gap-6 md:grid-cols-2 mt-6">
                {hubCards.map((card) => (
                    <Card
                        key={card.id}
                        onClick={() => router.push(card.href)}
                        className={cn(
                            "group cursor-pointer border-l-4 hover:shadow-lg transition-all duration-300",
                            "hover:scale-[1.02] relative overflow-hidden",
                            card.color
                        )}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        {card.icon}
                                    </div>
                                    <CardTitle className="text-xl tracking-tight">
                                        {card.title}
                                    </CardTitle>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-sm leading-relaxed">
                                {card.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
}
