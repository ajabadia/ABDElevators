import { requirePermission } from '@/lib/auth';
import { PromptsHubClient } from "./PromptsHubClient";
import { PromptService } from '@/services/llm/prompt-service';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types/roles';

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
    const promptsPromise = PromptService.listPrompts({
        tenantId: isSuperAdmin ? null : session.user.tenantId,
        activeOnly: false,
        environment
    });

    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <PromptsHubClient initialPromptsPromise={promptsPromise} initialEnvironment={environment} />
        </Suspense>
    );
}
