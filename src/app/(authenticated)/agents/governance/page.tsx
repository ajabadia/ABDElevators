import { requirePermission } from '@/lib/auth';
import { AiGovernanceClient } from "./AiGovernanceClient";
import { AiModelManager } from '@/services/core/ai-model-manager';
import { Session } from 'next-auth';
import { FeatureShell } from '@/components/shared/FeatureShell';
import { getTranslations } from 'next-intl/server';
import { Shield } from 'lucide-react';

/**
 * 🏛️ AI Governance & Model Management (Server-Side Enforced)
 * Enforces Guardian policy 'admin:ai:governance' before rendering.
 * Phase 412: Zero-Waterfall fetch.
 */
export default async function AiGovernancePage() {
    const session = await requirePermission('admin:ai:governance', 'manage') as Session;
    const t = await getTranslations("admin.governance");

    // 📡 Server-side fetch for zero waterfall
    const initialData = await AiModelManager.getTenantAiConfig(session);

    return (
        <FeatureShell
            title={t("title")}
            subtitle={t("subtitle")}
            icon={<Shield className="w-6 h-6 text-primary" />}
            backHref="/agents"
        >
            <div className="mt-6">
                <AiGovernanceClient initialData={initialData} />
            </div>
        </FeatureShell>
    );
}
