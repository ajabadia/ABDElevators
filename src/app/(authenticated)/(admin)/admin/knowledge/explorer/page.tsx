"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { KnowledgeExplorer } from "@/components/admin/knowledge/KnowledgeExplorer";
import { BrainCircuit } from "lucide-react";

/**
 * 🧠 Neural Explorer Module
 * Explore vectorized chunks, simulate RAG queries and audit retrieval quality.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function KnowledgeExplorerPage() {
    const t = useTranslations("knowledge_hub");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.explorer.title")}
                subtitle={t("cards.explorer.description")}
                icon={<BrainCircuit className="w-6 h-6 text-primary" />}
                backHref="/admin/knowledge"
            />

            <div className="mt-6">
                <KnowledgeExplorer />
            </div>
        </PageContainer>
    );
}
