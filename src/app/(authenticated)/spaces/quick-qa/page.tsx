"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { QuickQAPanel } from "@/components/spaces/QuickQAPanel";
import { Zap } from "lucide-react";

/**
 * ⚡ Quick Q&A Module (Phase 125.3)
 * Ephemeral chat interface for "Paste & Ask" functionality.
 * UI Standardized with PageContainer/Header pattern and semantic color tokens.
 */
export default function QuickQAPage() {
    const t = useTranslations("spaces.quick_qa");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("title")}
                subtitle={t("desc")}
                icon={<Zap className="w-6 h-6 text-primary" />}
                backHref="/spaces"
            />

            <div className="mt-6">
                <QuickQAPanel />
            </div>
        </PageContainer>
    );
}
