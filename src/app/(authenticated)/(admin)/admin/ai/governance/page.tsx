"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, BrainCircuit, Save, RefreshCw, AlertCircle, Info, Zap, Scale, LayoutGrid, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AI_MODELS } from "@abd/platform-core";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";

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
 * 🏛️ AI Governance & Model Management
 * Central control panel for LLM selection and safety policies.
 */
export default function AiGovernancePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const resp = await fetch("/api/admin/ai/governance");
            if (!resp.ok) throw new Error("Failed to load config");
            const data = await resp.json();
            setConfig(data);
        } catch (err) {
            toast.error("Error cargando configuración de IA");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const resp = await fetch("/api/admin/ai/governance", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });
            if (!resp.ok) throw new Error("Update failed");
            toast.success("Gobernanza de IA actualizada correctamente");
        } catch (err) {
            toast.error("Error guardando cambios");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
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
                                    value={config.defaultModel}
                                    onValueChange={(v) => setConfig({ ...config, defaultModel: v })}
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
                                    value={config?.embeddingModel || "gemini-embedding-001"}
                                    onValueChange={(v) => setConfig({ ...config, embeddingModel: v })}
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
                                    value={config?.fallbackModel || "gemini-2.5-flash"}
                                    onValueChange={(v) => setConfig({ ...config, fallbackModel: v })}
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
                                            value={config.ragGeneratorModel}
                                            onChange={(v) => setConfig({ ...config, ragGeneratorModel: v })}
                                        />
                                        <ModelSelector
                                            label="Re-escritor de Consultas"
                                            value={config.ragQueryRewriterModel}
                                            onChange={(v) => setConfig({ ...config, ragQueryRewriterModel: v })}
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
                                            value={config.workflowRouterModel}
                                            onChange={(v) => setConfig({ ...config, workflowRouterModel: v })}
                                        />
                                        <ModelSelector
                                            label="Analista de Nodos"
                                            value={config.workflowNodeAnalyzerModel}
                                            onChange={(v) => setConfig({ ...config, workflowNodeAnalyzerModel: v })}
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
                                            value={config.ontologyRefinerModel}
                                            onChange={(v) => setConfig({ ...config, ontologyRefinerModel: v })}
                                        />
                                        <ModelSelector
                                            label="Generador de Informes"
                                            value={config.reportGeneratorModel}
                                            onChange={(v) => setConfig({ ...config, reportGeneratorModel: v })}
                                        />
                                        <ModelSelector
                                            label="Extractor de Consultas"
                                            value={config.queryEntityExtractorModel}
                                            onChange={(v) => setConfig({ ...config, queryEntityExtractorModel: v })}
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
                                value={config?.maxTokensPerRequest || 4096}
                                onChange={(e) => setConfig({ ...config, maxTokensPerRequest: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Límite Diario de Tokens</Label>
                            <Input
                                type="number"
                                value={config?.dailyTokenLimit || 500000}
                                onChange={(e) => setConfig({ ...config, dailyTokenLimit: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Límite Diario ($ USD)</Label>
                            <Input
                                type="number"
                                value={config?.dailyBudgetLimit || 10}
                                onChange={(e) => setConfig({ ...config, dailyBudgetLimit: Number(e.target.value) })}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Anonimización PII</Label>
                                <p className="text-[10px] text-muted-foreground italic">Masking automático</p>
                            </div>
                            <Switch
                                checked={!!config?.piiMaskingEnabled}
                                onCheckedChange={(v) => setConfig({ ...config, piiMaskingEnabled: v })}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Explicabilidad</Label>
                                <p className="text-[10px] text-muted-foreground italic">Incluir "Thought Process"</p>
                            </div>
                            <Switch
                                checked={!!config?.explainabilityEnabled}
                                onCheckedChange={(v) => setConfig({ ...config, explainabilityEnabled: v })}
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
                    <Button variant="outline" onClick={fetchConfig} disabled={saving}>
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
