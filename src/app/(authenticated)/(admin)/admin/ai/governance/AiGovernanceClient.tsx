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
    AlertCircle
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

/**
 * 🛠️ Helper Component for Model Selectors
 */
function ModelSelector({ label, value, onChange, description }: {
    label: string,
    value?: string,
    onChange: (v: string) => void,
    description?: string
}) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold">{label}</Label>
            <Select value={value || "default"} onValueChange={onChange}>
                <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecciona modelo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">Default (Gobernanza)</SelectItem>
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
    // 📡 Data Fetching (Phase 222B Alignment)
    const { data: configData, isLoading: loading, refresh } = useApiItem<any>({
        endpoint: "/api/admin/ai/governance",
    });

    const [localConfig, setLocalConfig] = useState<any>(null);

    // Sync local state when data loads
    useEffect(() => {
        if (configData) setLocalConfig(configData);
    }, [configData]);

    const { mutate: saveConfig, isLoading: saving } = useApiMutation({
        endpoint: "/api/admin/ai/governance",
        method: "PATCH",
        onSuccess: () => {
            toast.success("Gobernanza de IA actualizada correctamente");
            refresh();
        },
        onError: () => toast.error("Error guardando cambios")
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
        <PageContainer>
            <PageHeader
                title="Gobernanza de IA"
                subtitle="Gestión centralizada de modelos, límites y políticas de seguridad."
                icon={<Shield className="w-6 h-6 text-primary" />}
            />

            <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
                {/* 1. Selección de Modelos */}
                <Card className="lg:col-span-2 border-primary/20 shadow-md">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-primary" />
                            <CardTitle>Modelos Contractuales</CardTitle>
                        </div>
                        <CardDescription>
                            Configura los modelos por defecto y fallback para toda la plataforma.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    Modelo Principal (Default)
                                </Label>
                                <Select
                                    value={localConfig.defaultModel}
                                    onValueChange={(v) => setLocalConfig({ ...localConfig, defaultModel: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona modelo" />
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
                                    Usado para el 90% de las operaciones de RAG y análisis.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                    Modelo de Embeddings (Vectores)
                                </Label>
                                <Select
                                    value={localConfig?.embeddingModel || "gemini-embedding-001"}
                                    onValueChange={(v) => setLocalConfig({ ...localConfig, embeddingModel: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona modelo" />
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
                                    Determina la calidad de la búsqueda vectorial.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
                                    <RefreshCw className="w-4 h-4" />
                                    Modelo de Respaldo (Fallback)
                                </Label>
                                <Select
                                    value={localConfig?.fallbackModel || "gemini-2.5-flash"}
                                    onValueChange={(v) => setLocalConfig({ ...localConfig, fallbackModel: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona modelo" />
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
                <Card className="lg:col-span-2 border-primary/20 shadow-md">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-primary" />
                            <CardTitle>Mapeo Funcional por Tarea</CardTitle>
                        </div>
                        <CardDescription>
                            Define qué modelo específico debe realizar cada tarea crítica del sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="rag">
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-2 font-bold">
                                        <BrainCircuit className="w-4 h-4" />
                                        RAG & Búsqueda de Documentos
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <ModelSelector
                                            label="Generador de Respuestas (RAG)"
                                            value={localConfig.ragGeneratorModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, ragGeneratorModel: v })}
                                        />
                                        <ModelSelector
                                            label="Re-escritor de Consultas"
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
                                        Orquestación & Workflows
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <ModelSelector
                                            label="Enrutador de Workflows"
                                            value={localConfig.workflowRouterModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, workflowRouterModel: v })}
                                        />
                                        <ModelSelector
                                            label="Analista de Nodos"
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
                                        Extracción & Análisis Técnico
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <ModelSelector
                                            label="Extractor de Grafos"
                                            value={localConfig.ontologyRefinerModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, ontologyRefinerModel: v })}
                                        />
                                        <ModelSelector
                                            label="Generador de Informes"
                                            value={localConfig.reportGeneratorModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, reportGeneratorModel: v })}
                                        />
                                        <ModelSelector
                                            label="Extractor de Consultas"
                                            value={localConfig.queryEntityExtractorModel}
                                            onChange={(v) => setLocalConfig({ ...localConfig, queryEntityExtractorModel: v })}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>

                {/* 2. Control de Costos y Límites */}
                <Card className="border-accent/20">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-accent">
                            <Scale className="w-5 h-5" />
                            <CardTitle>Límites & Cuotas</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Max Tokens por Request</Label>
                            <Input
                                type="number"
                                value={localConfig?.maxTokensPerRequest || 4096}
                                onChange={(e) => setLocalConfig({ ...localConfig, maxTokensPerRequest: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Límite Diario de Tokens</Label>
                            <Input
                                type="number"
                                value={localConfig?.dailyTokenLimit || 500000}
                                onChange={(e) => setLocalConfig({ ...localConfig, dailyTokenLimit: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Límite Diario ($ USD)</Label>
                            <Input
                                type="number"
                                value={localConfig?.dailyBudgetLimit || 10}
                                onChange={(e) => setLocalConfig({ ...localConfig, dailyBudgetLimit: Number(e.target.value) })}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Anonimización PII</Label>
                                <p className="text-[10px] text-muted-foreground italic">Masking automático</p>
                            </div>
                            <Switch
                                checked={!!localConfig?.piiMaskingEnabled}
                                onCheckedChange={(v) => setLocalConfig({ ...localConfig, piiMaskingEnabled: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Explicabilidad</Label>
                                <p className="text-[10px] text-muted-foreground italic">Incluir "Thought Process"</p>
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
                            Prevención de desbordamiento de costos activo.
                        </div>
                    </CardFooter>
                </Card>

                {/* 3. Acción de Guardado (Mobile Floating or Bottom) */}
                <div className="lg:col-span-3 flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setLocalConfig(configData)} disabled={saving}>
                        Descartar
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2 px-8">
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Gobernanza
                    </Button>
                </div>
            </div>
        </PageContainer>
    );
}
