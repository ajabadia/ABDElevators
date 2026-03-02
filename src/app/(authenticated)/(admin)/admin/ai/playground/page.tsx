import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Sparkles } from "lucide-react";
import { enforcePermission } from "@/lib/guardian-guard";
import { PlaygroundSandbox } from "@/components/admin/ai/PlaygroundSandbox";

/**
 * ✨ AI Playground Module - RAG Experiment Lab
 * Experiment with models and prompts in a safe environment.
 * UI Standardized with PageContainer/Header pattern.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function PlaygroundPage() {
    await enforcePermission('admin:ai:playground', 'manage');
    const t = await getTranslations("aiHub");

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("cards.playground.title")}
                subtitle={t("cards.playground.description")}
                icon={<Sparkles className="w-6 h-6 text-primary" />}
                backHref="/admin/ai"
            />

            <PlaygroundSandbox />
        </PageContainer>
    );
}
