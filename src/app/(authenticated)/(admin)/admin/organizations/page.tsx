"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Palette, Database, Puzzle, CreditCard, ArrowRight } from "lucide-react";
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
 * 🏢 Organizations Hub Dashboard (Phase 133)
 * Central navigation hub for all organization configuration modules.
 * UI Standardized with Hub Dashboard pattern.
 */
export default function OrganizationsHubPage() {
    const router = useRouter();
    const t = useTranslations("organizations_hub");

    const hubCards: HubCard[] = [
        {
            id: "general",
            title: t("cards.general.title"),
            description: t("cards.general.description"),
            href: "/admin/organizations/general",
            icon: <Building2 className="w-6 h-6" />,
            color: "border-l-primary"
        },
        {
            id: "branding",
            title: t("cards.branding.title"),
            description: t("cards.branding.description"),
            href: "/admin/organizations/branding",
            icon: <Palette className="w-6 h-6" />,
            color: "border-l-secondary"
        },
        {
            id: "storage",
            title: t("cards.storage.title"),
            description: t("cards.storage.description"),
            href: "/admin/organizations/storage",
            icon: <Database className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: "features",
            title: t("cards.features.title"),
            description: t("cards.features.description"),
            href: "/admin/organizations/features",
            icon: <Puzzle className="w-6 h-6" />,
            color: "border-l-muted"
        },
        {
            id: "billing",
            title: t("cards.billing.title"),
            description: t("cards.billing.description"),
            href: "/admin/organizations/billing",
            icon: <CreditCard className="w-6 h-6" />,
            color: "border-l-primary/50"
        }
    ];

    return (
        <PageContainer className="animate-in fade-in duration-500">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon={<Building2 className="w-6 h-6 text-primary" />}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
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
