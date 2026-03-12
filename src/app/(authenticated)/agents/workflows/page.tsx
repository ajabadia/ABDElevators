import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { WorkflowCanvas } from "@/components/workflow-editor/WorkflowCanvas";
import { GitFork, Loader2 } from "lucide-react";
import { requirePermission } from '@/lib/auth';
import { WorkflowService } from '@/services/ops/WorkflowService';
import { Suspense } from 'react';
import { useEnvironmentStore } from '@/store/environment-store'; // Wait, server component cannot use client hooks easily, but we can pass it or use a default.

/**
 * 🔀 Workflows Module (Phase 412)
 * Refactored to Server Component for Zero-Waterfall.
 */
export default async function WorkflowsPage({ searchParams }: { searchParams: Promise<{ environment?: string }> }) {
    const session = await requirePermission('admin:ai:workflows', 'manage');
    const t = await getTranslations("aiHub");

    const params = await searchParams;
    const environment = (params.environment as any) || 'PRODUCTION';

    // 📡 Server-side fetch promise
    const workflowsPromise = WorkflowService.listDefinitions({
        tenantId: session.user.tenantId,
        entityType: 'ENTITY',
        environment: environment
    }, session as any);

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.workflows.title")}
                subtitle={t("cards.workflows.description")}
                icon={<GitFork className="w-6 h-6 text-primary" />}
                backHref="/agents"
            />

            <div className="mt-6 flex-1 min-h-[750px] border border-border rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-inner">
                <Suspense fallback={
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                }>
                    <WorkflowCanvas workflowsPromise={workflowsPromise} environment={environment} />
                </Suspense>
            </div>
        </PageContainer>
    );
}
