"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Zap, UserCircle, Box, FlaskConical, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HubCard {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
    isActive?: boolean;
}

/**
 * 🌌 Spaces Hub Dashboard (Phase 125.3)
 * Central navigation hub for all Space-related modules.
 */
export default function SpacesHubPage() {
    const router = useRouter();
    const t = useTranslations("spaces.hub");

    const hubCards: HubCard[] = [
        {
            id: "quick-qa",
            title: t("cards.quick_qa.title"),
            description: t("cards.quick_qa.description"),
            href: "/spaces/quick-qa",
            icon: <Zap className="w-6 h-6" />,
            color: "border-l-primary",
            isActive: true
        },
        {
            id: "personal",
            title: t("cards.personal.title"),
            description: t("cards.personal.description"),
            href: "/spaces/personal",
            icon: <UserCircle className="w-6 h-6" />,
            color: "border-l-secondary"
        },
        {
            id: "collections",
            title: t("cards.collections.title"),
            description: t("cards.collections.description"),
            href: "/spaces/collections",
            icon: <Box className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: "playground",
            title: t("cards.playground.title"),
            description: t("cards.playground.description"),
            href: "/spaces/playground",
            icon: <FlaskConical className="w-6 h-6" />,
            color: "border-l-muted",
            isActive: true
        }
    ];

    return (
        <PageContainer className="animate-in fade-in duration-500">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon={<Layers className="w-6 h-6 text-primary" />}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mt-6">
                {hubCards.map((card) => (
                    <Card
                        key={card.id}
                        onClick={() => router.push(card.href)}
                        className={cn(
                            "group cursor-pointer border-l-4 hover:shadow-lg transition-all duration-300",
                            "hover:scale-[1.02] relative overflow-hidden",
                            card.color,
                            !card.isActive && "opacity-75"
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
                            {!card.isActive && (
                                <span className="inline-flex items-center mt-3 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {t("coming_soon")}
                                </span>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
}
