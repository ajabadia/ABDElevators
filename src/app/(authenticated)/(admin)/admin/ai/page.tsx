import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Activity, GitFork, Sparkles, LineChart, ArrowRight, Terminal, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";

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
 * 🤖 AI Hub Dashboard (Phase 133/233)
 * Central navigation hub for all AI-related modules.
 * UI Standardized with Hub Dashboard pattern.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function AIHubPage() {
    await requireRole([UserRole.SUPER_ADMIN]);
    const t = await getTranslations("aiHub");

    const hubCards: HubCard[] = [
        {
            id: "rag-quality",
            title: t("cards.rag_quality.title"),
            description: t("cards.rag_quality.description"),
            href: "/admin/ai/rag-quality",
            icon: <Activity className="w-6 h-6" />,
            color: "border-l-primary",
            isActive: true
        },
        {
            id: "workflows",
            title: t("cards.workflows.title"),
            description: t("cards.workflows.description"),
            href: "/admin/ai/workflows",
            icon: <GitFork className="w-6 h-6" />,
            color: "border-l-secondary",
            isActive: true
        },
        {
            id: "predictive",
            title: t("cards.predictive.title"),
            description: t("cards.predictive.description"),
            href: "/admin/ai/predictive",
            icon: <LineChart className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: "playground",
            title: t("cards.playground.title"),
            description: t("cards.playground.description"),
            href: "/admin/ai/playground",
            icon: <Sparkles className="w-6 h-6" />,
            color: "border-l-muted",
            isActive: true
        },
        {
            id: "governance",
            title: "Gobernanza de IA",
            description: "Control central de modelos y límites de uso.",
            href: "/admin/ai/governance",
            icon: <Shield className="w-6 h-6 text-emerald-500" />,
            color: "border-l-emerald-500",
            isActive: true
        },
        {
            id: "prompts",
            title: t("cards.prompts.title"),
            description: t("cards.prompts.description"),
            href: "/admin/prompts",
            icon: <Terminal className="w-6 h-6" />,
            color: "border-l-blue-500",
            isActive: true
        }
    ];

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon={<BrainCircuit className="w-6 h-6 text-primary" />}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                {hubCards.map((card) => {
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
                                        🚧 {t("coming_soon")}
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
        </PageContainer>
    );
}
