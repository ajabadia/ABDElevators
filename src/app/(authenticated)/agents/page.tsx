import { getTranslations } from "next-intl/server";
import { BrainCircuit, Activity, GitFork, Sparkles, LineChart, Terminal, Shield, Bot, BarChart3, TrendingUp, ShieldAlert } from "lucide-react";
import React from "react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 🤖 AI Hub Dashboard (Phase 133/233)
 * Central navigation hub for all AI-related modules.
 * UI Standardized with Hub Dashboard pattern.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function AIHubPage() {
    await requireRole([UserRole.SUPER_ADMIN]);
    const t = await getTranslations("common");
    const tAi = await getTranslations("aiHub");

    const hubCards: HubSection[] = [
        {
            id: "rag_quality",
            title: t("navigation.nav.agents.rag_quality"),
            description: tAi("cards.rag_quality.description"),
            href: "/agents/rag-quality",
            icon: <Activity className="w-6 h-6" />,
            color: "border-l-primary",
            isActive: true
        },
        {
            id: "golden_sets",
            title: t("navigation.nav.agents.golden_sets"),
            description: tAi("cards.golden_sets.description"),
            href: "/agents/golden-sets",
            icon: <ShieldAlert className="w-6 h-6 text-primary" />,
            color: "border-l-amber-500",
            isActive: true
        },
        {
            id: "quality_insights",
            title: t("navigation.nav.agents.quality_insights"),
            description: tAi("cards.quality_insights.description"),
            href: "/agents/quality",
            icon: <BarChart3 className="w-6 h-6" />,
            color: "border-l-emerald-600",
            isActive: true
        },
        {
            id: "agent_builder",
            title: t("navigation.nav.agents.agent_builder"),
            description: tAi("cards.agent_builder.description"),
            href: "/agents/agents",
            icon: <Bot className="w-6 h-6" />,
            color: "border-l-indigo-600",
            isActive: true
        },
        {
            id: "workflows",
            title: t("navigation.nav.agents.workflows"),
            description: tAi("cards.workflows.description"),
            href: "/agents/workflows",
            icon: <GitFork className="w-6 h-6" />,
            color: "border-l-secondary",
            isActive: true
        },
        {
            id: "predictive",
            title: t("navigation.nav.agents.predictive"),
            description: tAi("cards.predictive.description"),
            href: "/agents/predictive",
            icon: <LineChart className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: "playground",
            title: t("navigation.nav.agents.playground"),
            description: tAi("cards.playground.description"),
            href: "/agents/playground",
            icon: <Sparkles className="w-6 h-6" />,
            color: "border-l-muted",
            isActive: true
        },
        {
            id: 'trends',
            title: t('navigation.nav.intelligence.trends'),
            description: tAi('cards.trends.description'),
            href: '/intelligence/trends',
            icon: <TrendingUp className="w-5 h-5" />,
            color: "border-l-teal-500",
            resource: 'admin:ai',
            action: 'read'
        },
        {
            id: "governance",
            title: t("navigation.nav.agents.governance"),
            description: tAi("cards.governance.description"),
            href: "/agents/governance",
            icon: <Shield className="w-6 h-6 text-emerald-500" />,
            color: "border-l-emerald-500",
            isActive: true
        },
        {
            id: "prompts",
            title: t("navigation.nav.agents.prompts"),
            description: tAi("cards.prompts.description"),
            href: "/agents/prompts",
            icon: <Terminal className="w-6 h-6" />,
            color: "border-l-blue-500",
            isActive: true
        }
    ];

    return (
        <HubPage
            title={t("navigation.nav.agents.label")}
            subtitle={tAi("subtitle")}
            icon={<BrainCircuit className="w-6 h-6 text-primary" />}
            sections={hubCards}
            columns={3}
            commonNamespace="common"
        />
    );
}
