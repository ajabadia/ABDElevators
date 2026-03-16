import { getTranslations } from "next-intl/server";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { AgentBuilder } from "@/components/admin/agents/AgentBuilder";
import { Bot } from "lucide-react";
import { requirePermission } from '@/lib/auth';

/**
 * 🤖 Agent Builder Page (Phase 308)
 * Interface to configure and deploy custom AI agents.
 */
export default async function AgentBuilderPage() {
    await requirePermission('admin:ai:agents', 'read');
    const t = await getTranslations("admin.ai_agents");

    return (
        <FeatureShell
            title={t("title")}
            subtitle={t("subtitle")}
            icon={<Bot className="w-6 h-6 text-primary" />}
            backHref="/admin/ai"
        >
            <div className="mt-6">
                <AgentBuilder />
            </div>
        </FeatureShell>
    );
}
