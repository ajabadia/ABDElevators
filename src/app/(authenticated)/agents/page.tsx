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
    const t = await getTranslations("aiHub");

    const hubCards: HubSection[] = [
        {
            id: "rag-quality",
            title: t("cards.rag_quality.title"),
            description: t("cards.rag_quality.description"),
            href: "/agents/rag-quality",
            icon: <Activity className="w-6 h-6" />,
            color: "border-l-primary",
            isActive: true
        },
        {
            id: "golden-sets",
            title: "Colecciones de Oro",
            description: "Gestión de ground truth y datasets de validación para el RAG.",
            href: "/agents/golden-sets",
            icon: <ShieldAlert className="w-6 h-6 text-primary" />,
            color: "border-l-primary",
            isActive: true
        },
        {
            id: "quality-insights",
            title: t("cards.quality_insights.title"),
            description: t("cards.quality_insights.description"),
            href: "/agents/quality",
            icon: <BarChart3 className="w-6 h-6" />,
            color: "border-l-emerald-600",
            isActive: true
        },
        {
            id: "agent-builder",
            title: t("cards.agent_builder.title"),
            description: t("cards.agent_builder.description"),
            href: "/agents/agents",
            icon: <Bot className="w-6 h-6" />,
            color: "border-l-indigo-600",
            isActive: true
        },
        {
            id: "workflows",
            title: t("cards.workflows.title"),
            description: t("cards.workflows.description"),
            href: "/agents/workflows",
            icon: <GitFork className="w-6 h-6" />,
            color: "border-l-secondary",
            isActive: true
        },
        {
            id: "predictive",
            title: t("cards.predictive.title"),
            description: t("cards.predictive.description"),
            href: "/agents/predictive",
            icon: <LineChart className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: "playground",
            title: t("cards.playground.title"),
            description: t("cards.playground.description"),
            href: "/agents/playground",
            icon: <Sparkles className="w-6 h-6" />,
            color: "border-l-muted",
            isActive: true
        },
        {
            id: 'trends',
            title: t('cards.trends.title'),
            description: t('cards.trends.description'),
            href: '/intelligence/trends',
            icon: <TrendingUp className="w-5 h-5" />,
            color: "border-l-teal-500",
            resource: 'admin:ai',
            action: 'read'
        },
        {
            id: "governance",
            title: "Gobernanza de IA",
            description: "Control central de modelos y límites de uso.",
            href: "/agents/governance",
            icon: <Shield className="w-6 h-6 text-emerald-500" />,
            color: "border-l-emerald-500",
            isActive: true
        },
        {
            id: "prompts",
            title: t("cards.prompts.title"),
            description: t("cards.prompts.description"),
            href: "/agents/prompts_legacy",
            icon: <Terminal className="w-6 h-6" />,
            color: "border-l-blue-500",
            isActive: true
        }
    ];

    return (
        <HubPage
            title={t("title")}
            subtitle={t("subtitle")}
            icon={<BrainCircuit className="w-6 h-6 text-primary" />}
            sections={hubCards}
            columns={3}
            commonNamespace="aiHub"
        />
    );
}
