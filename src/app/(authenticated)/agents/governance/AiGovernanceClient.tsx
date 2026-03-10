"use client";

import { useApiItem } from "@/hooks/useApiItem";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    RefreshCw,
    Save,
    Shield,
    BrainCircuit,
    Zap,
    LayoutGrid,
    Share2,
    FileText,
    Scale,
    AlertCircle,
    Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { AI_MODELS } from "@abd/platform-core";
import { useTranslations } from "next-intl";

/**
 * 🛠️ Configuration Interface for AI Governance
 */
export interface AiGovernanceConfig {
    defaultModel: string;
    embeddingModel: string;
    fallbackModel: string;
    ragGeneratorModel: string;
    ragQueryRewriterModel: string;
    workflowRouterModel: string;
    workflowNodeAnalyzerModel: string;
    ontologyRefinerModel: string;
    reportGeneratorModel: string;
    queryEntityExtractorModel: string;
    sidekickModel: string;
    maxTokensPerRequest: number;
    dailyTokenLimit: number;
    dailyBudgetLimit: number;
    piiMaskingEnabled: boolean;
    explainabilityEnabled: boolean;
}

/**
 * 🛠️ Helper Component for Model Selectors
 */
function ModelSelector({ label, value, onChange, description }: {
    label: string,
    value?: string,
    onChange: (v: string) => void,
    description?: string
}) {
    const t = useTranslations("admin.governance");

    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold">{label}</Label>
            <Select value={value || "default"} onValueChange={onChange}>
                <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={t("models.select_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">{t("models.default_option")}</SelectItem>
                    {AI_MODELS.filter(m => m.isEnabled).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                            {m.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
        </div>
    );
}

/**
 * 🏛️ AI Governance Hub Client Component
 */
export function AiGovernanceClient() {
    const t = useTranslations("admin.governance");

    // 📡 Data Fetching (Phase 222B Alignment)
    const { data: configData, isLoading: loading, refresh } = useApiItem<AiGovernanceConfig>({
        endpoint: "/api/admin/ai/governance",
    });

    const [localConfig, setLocalConfig] = useState<AiGovernanceConfig | null>(null);

    // Sync local state when data loads
    useEffect(() => {
        if (configData) setLocalConfig(configData);
    }, [configData]);

    const { mutate: saveConfig, isLoading: saving } = useApiMutation({
        endpoint: "/api/admin/ai/governance",
        method: "PATCH",
        onSuccess: () => {
            toast.success(t("success"));
            refresh();
        },
        onError: () => toast.error(t("error"))
    });

    const handleSave = () => {
        saveConfig(localConfig);
    };

    if (loading || !localConfig) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon={
                    <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                }
                backHref="/agents"
            />

            <div className="grid gap-6 mt-8 md:grid-cols-2 lg:grid-cols-3">
                {/* 1. Selección de Modelos */}
                <Card className="lg:col-span-2 border-primary/20 shadow-xl bg-gradient-to-br from-card to-primary/5">
                    <CardHeader className="border-b border-primary/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <BrainCircuit className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold tracking-tight">{t("models.title")}</CardTitle>
                                <CardDescription className="text-xs">
                                    {t("models.description")}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    {t("models.default.label")}
                                </Label>
                                <Select
                                    value={localConfig.defaultModel}
                                    onValueChange={(v) => setLocalConfig({ ...localConfig, defaultModel: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("models.select_placeholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AI_MODELS.filter(m => m.isEnabled).map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground italic">
                                    {t("models.default.desc")}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                    {t("models.embeddings.label")}
                                </Label>
                                <Select
                                    value={localConfig?.embeddingModel || "gemini-embedding-001"}
                                    onValueChange={(v) => setLocalConfig({ ...localConfig, embeddingModel: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("models.select_placeholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AI_MODELS.filter(m => m.isEnabled).map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground italic">
                                    {t("models.embeddings.desc")}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
                                    <RefreshCw className="w-4 h-4" />
                                    {t("models.fallback.label")}
                                </Label>
                                <Select
                                    value={localConfig?.fallbackModel || "gemini-2.5-flash"}
                                    onValueChange={(v) => setLocalConfig({ ...localConfig, fallbackModel: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("models.select_placeholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AI_MODELS.filter(m => m.isEnabled).map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 1.5 Mapeo Funcional (Phase 212) */}
                <Card className="lg:col-span-2 border-primary/20 shadow-xl bg-gradient-to-br from-card to-indigo-500/5">
                    <CardHeader className="border-b border-primary/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                <LayoutGrid className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold tracking-tight">{t("mapping.title")}</CardTitle>
                                <CardDescription className="text-xs">
                                    {t("mapping.description")}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="rag">
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2 font-bold">
                                        <BrainCircuit className="w-4 h-4" />
                                        {t("mapping.rag.title")}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <ModelSelector
                                            label={t("mapping.rag.generator")}
                                            value={localConfig.ragGeneratorModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, ragGeneratorModel: v })}
                                        />
                                        <ModelSelector
                                            label={t("mapping.rag.rewriter")}
                                            value={localConfig.ragQueryRewriterModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, ragQueryRewriterModel: v })}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="workflows">
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2 font-bold">
                                        <Share2 className="w-4 h-4" />
                                        {t("mapping.workflows.title")}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <ModelSelector
                                            label={t("mapping.workflows.router")}
                                            value={localConfig.workflowRouterModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, workflowRouterModel: v })}
                                        />
                                        <ModelSelector
                                            label={t("mapping.workflows.analyzer")}
                                            value={localConfig.workflowNodeAnalyzerModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, workflowNodeAnalyzerModel: v })}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="extraction">
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2 font-bold">
                                        <FileText className="w-4 h-4" />
                                        {t("mapping.extraction.title")}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <ModelSelector
                                            label={t("mapping.extraction.graph")}
                                            value={localConfig.ontologyRefinerModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, ontologyRefinerModel: v })}
                                        />
                                        <ModelSelector
                                            label={t("mapping.extraction.report")}
                                            value={localConfig.reportGeneratorModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, reportGeneratorModel: v })}
                                        />
                                        <ModelSelector
                                            label={t("mapping.extraction.query")}
                                            value={localConfig.queryEntityExtractorModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, queryEntityExtractorModel: v })}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="sidekick">
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2 font-bold">
                                        <Bot className="w-4 h-4" />
                                        Asistentes y Copilotos
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <ModelSelector
                                            label="AI Sidekick (Contextual)"
                                            value={localConfig.sidekickModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, sidekickModel: v })}
                                            description="Modelo conversacional utilizado por el asistente lateral en toda la app."
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>

                {/* 2. Control de Costos y Límites */}
                <Card className="border-accent/20 shadow-lg bg-gradient-to-br from-card to-accent/5">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 text-accent">
                            <div className="p-2 rounded-lg bg-accent/10">
                                <Scale className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold tracking-tight">{t("limits.title")}</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("limits.max_tokens")}</Label>
                            <Input
                                type="number"
                                value={localConfig?.maxTokensPerRequest || 4096}
                                onChange={(e) => setLocalConfig({ ...localConfig, maxTokensPerRequest: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("limits.daily_tokens")}</Label>
                            <Input
                                type="number"
                                value={localConfig?.dailyTokenLimit || 500000}
                                onChange={(e) => setLocalConfig({ ...localConfig, dailyTokenLimit: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("limits.daily_budget")}</Label>
                            <Input
                                type="number"
                                value={localConfig?.dailyBudgetLimit || 10}
                                onChange={(e) => setLocalConfig({ ...localConfig, dailyBudgetLimit: Number(e.target.value) })}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">{t("limits.pii.label")}</Label>
                                <p className="text-[10px] text-muted-foreground italic">{t("limits.pii.desc")}</p>
                            </div>
                            <Switch
                                checked={!!localConfig?.piiMaskingEnabled}
                                onCheckedChange={(v) => setLocalConfig({ ...localConfig, piiMaskingEnabled: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">{t("limits.explain.label")}</Label>
                                <p className="text-[10px] text-muted-foreground italic">{t("limits.explain.desc")}</p>
                            </div>
                            <Switch
                                checked={!!localConfig?.explainabilityEnabled}
                                onCheckedChange={(v) => setLocalConfig({ ...localConfig, explainabilityEnabled: v })}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 pt-4">
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 w-full justify-center">
                            <AlertCircle className="w-3 h-3" />
                            {t("limits.warning")}
                        </div>
                    </CardFooter>
                </Card>

                {/* 3. Acción de Guardado (Mobile Floating or Bottom) */}
                <div className="lg:col-span-3 flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setLocalConfig(configData)} disabled={saving}>
                        {t("actions.discard")}
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2 px-8">
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {t("actions.save")}
                    </Button>
                </div>
            </div>
        </PageContainer>
    );
}
