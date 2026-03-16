import { requirePermission } from '@/lib/auth';
import { PromptsHubClient } from "./PromptsHubClient";
import { PromptService } from '@/services/llm/prompt-service';
import { Suspense } from 'react';
import { LoadingState } from '@/components/shared/LoadingState';
import { UserRole } from '@/types/roles';
import { Prompt } from '@/lib/schemas';

/**
 * 📝 Prompts Hub Page (Phase 412)
 * Refactored to Server Component for Zero-Waterfall.
 */
export default async function AdminPromptsPage({ searchParams }: { searchParams: Promise<{ environment?: string }> }) {
    const session = await requirePermission('admin:prompts', 'manage');
    const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;
    const params = await searchParams;
    const environment = params.environment || 'PRODUCTION';

    // 📡 Server-side fetch promise
    const promptsPromise: Promise<Prompt[]> = PromptService.listPrompts({
        tenantId: isSuperAdmin ? null : session.user.tenantId,
        activeOnly: false,
        environment
    });

    return (
        <Suspense fallback={<LoadingState fullScreen message="Cargando configuración de prompts..." />}>
            <PromptsHubClient initialPromptsPromise={promptsPromise as any} initialEnvironment={environment} />
        </Suspense>
    );
}
