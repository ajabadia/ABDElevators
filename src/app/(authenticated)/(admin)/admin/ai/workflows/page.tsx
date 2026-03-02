import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { WorkflowCanvas } from "@/components/workflow-editor/WorkflowCanvas";
import { GitFork } from "lucide-react";
import { enforcePermission } from "@/lib/guardian-guard";

/**
 * 🔀 Workflows Module (Phase 233)
 * Configure and monitor autonomous agents for complex tasks.
 * UI Standardized with PageContainer/Header pattern.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function WorkflowsPage() {
    await enforcePermission('admin:ai:workflows', 'manage');
    const t = await getTranslations("aiHub");

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
