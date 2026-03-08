import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
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
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon={<Bot className="w-6 h-6 text-primary" />}
                backHref="/admin/ai"
            />

            <div className="mt-6">
                <AgentBuilder />
            </div>
        </PageContainer>
    );
}
