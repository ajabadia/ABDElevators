import { getTranslations } from "next-intl/server";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { Sparkles } from "lucide-react";
import { requirePermission } from '@/lib/auth';
import { PlaygroundSandbox } from "@/components/admin/ai/PlaygroundSandbox";

/**
 * ✨ AI Playground Module - RAG Experiment Lab
 * Experiment with models and prompts in a safe environment.
 */
export default async function PlaygroundPage() {
    await requirePermission('admin:ai:playground', 'manage');
    const t = await getTranslations("aiHub");

    return (
        <FeatureShell
            title={t("cards.playground.title")}
            subtitle={t("cards.playground.description")}
            icon={<Sparkles className="w-6 h-6 text-primary" />}
            backHref="/admin/ai"
        >
            <PlaygroundSandbox />
        </FeatureShell>
    );
}
