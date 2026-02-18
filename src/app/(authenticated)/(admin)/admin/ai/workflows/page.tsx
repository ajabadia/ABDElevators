"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { WorkflowCanvas } from "@/components/workflow-editor/WorkflowCanvas";
import { GitFork } from "lucide-react";

/**
 * 🔀 Workflows Module
 * Configure and monitor autonomous agents for complex tasks.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function WorkflowsPage() {
    const t = useTranslations("aiHub");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.workflows.title")}
                subtitle={t("cards.workflows.description")}
                icon={<GitFork className="w-6 h-6 text-primary" />}
                backHref="/admin/ai"
            />

            <div className="mt-6 h-[600px] border border-border rounded-xl overflow-hidden bg-card">
                <WorkflowCanvas />
            </div>
        </PageContainer>
    );
}
