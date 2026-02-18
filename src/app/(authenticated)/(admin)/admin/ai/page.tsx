"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Activity, GitFork, Sparkles, LineChart, ArrowRight, Terminal } from "lucide-react";
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
 * 🤖 AI Hub Dashboard (Phase 133)
 * Central navigation hub for all AI-related modules.
 * UI Standardized with Hub Dashboard pattern.
 */
export default function AIHubPage() {
    const router = useRouter();
    const t = useTranslations("aiHub");

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
            id: "prompts",
            title: t("cards.prompts.title"),
            description: t("cards.prompts.description"),
            href: "/admin/prompts",
            icon: <Terminal className="w-6 h-6" />,
            color: "border-l-emerald-500",
            isActive: true
        }
    ];

    return (
        <PageContainer className="animate-in fade-in duration-500">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon={<BrainCircuit className="w-6 h-6 text-primary" />}
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
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
