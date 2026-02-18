"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import RagQualityDashboard from "@/components/admin/RagQualityDashboard";
import { Activity } from "lucide-react";

/**
 * 📊 RAG Quality Module
 * Monitor precision and relevance of generated responses.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function RagQualityPage() {
    const t = useTranslations("aiHub");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.rag_quality.title")}
                subtitle={t("cards.rag_quality.description")}
                icon={<Activity className="w-6 h-6 text-primary" />}
                backHref="/admin/ai"
            />

            <div className="mt-6">
                <RagQualityDashboard />
            </div>
        </PageContainer>
    );
}
