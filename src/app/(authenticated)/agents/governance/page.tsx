import { requirePermission } from '@/lib/auth';
import { AiGovernanceClient } from "./AiGovernanceClient";
import { AiModelManager } from '@/services/core/ai-model-manager';

/**
 * 🏛️ AI Governance & Model Management (Server-Side Enforced)
 * Enforces Guardian policy 'admin:ai:governance' before rendering.
 * Phase 412: Zero-Waterfall fetch.
 */
export default async function AiGovernancePage() {
    const session = await requirePermission('admin:ai:governance', 'manage');

    // 📡 Server-side fetch for zero waterfall
    const initialData = await AiModelManager.getTenantAiConfig(session as any);

    return <AiGovernanceClient initialData={initialData} />;
}
