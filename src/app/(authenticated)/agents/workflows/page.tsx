import { getTranslations } from "next-intl/server";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { WorkflowCanvas } from "@/components/workflow-editor/WorkflowCanvas";
import { GitFork, Loader2 } from "lucide-react";
import { LoadingState } from "@/components/shared/LoadingState";
import { requirePermission } from '@/lib/auth';
import { WorkflowService } from '@/services/ops/WorkflowService';
import { Suspense } from 'react';

/**
 * 🔀 Workflows Module (Phase 412)
 * Refactored to Server Component for Zero-Waterfall.
 */
export default async function WorkflowsPage({ searchParams }: { searchParams: Promise<{ environment?: string }> }) {
    const session = await requirePermission('admin:ai:workflows', 'manage');
    const t = await getTranslations("aiHub");

    const params = await searchParams;
    const environment = params.environment || 'PRODUCTION';

    // 📡 Server-side fetch promise
    const workflowsPromise = WorkflowService.listDefinitions({
        tenantId: session.user.tenantId,
        entityType: 'ENTITY',
        environment: environment
    }, session);

    return (
        <FeatureShell
            title={t("cards.workflows.title")}
            subtitle={t("cards.workflows.description")}
            icon={<GitFork className="w-6 h-6 text-primary" />}
            backHref="/agents"
        >
            <div className="mt-6 flex-1 min-h-[750px] border border-border rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-inner">
                <Suspense fallback={<LoadingState message="Cargando Workflow Canvas..." />}>
                    <WorkflowCanvas workflowsPromise={workflowsPromise} environment={environment} />
                </Suspense>
            </div>
        </FeatureShell>
    );
}
