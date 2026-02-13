"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RagQualityDashboard from "@/components/admin/RagQualityDashboard";
import { WorkflowCanvas } from "@/components/workflow-editor/WorkflowCanvas";
import { useTranslations } from "next-intl";
import { BrainCircuit, Activity, GitFork, Sparkles, LineChart } from "lucide-react";

export default function AIHubPage() {
    const t = useTranslations('ai_hub'); // Ensure namespace

    // Fallback strings
    const title = "Centro de Inteligencia Artificial";
    const subtitle = "Monitoreo, evaluación y orquestación de modelos generativos.";

    return (
        <PageContainer>
            <PageHeader
                title={title}
                subtitle={subtitle}
            />

            <Tabs defaultValue="rag-quality" className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto flex justify-start">
                    <TabsTrigger value="rag-quality" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        Calidad RAG
                    </TabsTrigger>
                    <TabsTrigger value="workflows" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <GitFork className="w-4 h-4 text-purple-600" />
                        Orquestación & Workflows
                    </TabsTrigger>
                    <TabsTrigger value="predictive" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <LineChart className="w-4 h-4 text-blue-600" />
                        Predictivo
                    </TabsTrigger>
                    <TabsTrigger value="playground" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        Playground
                    </TabsTrigger>
                </TabsList>

                {/* RAG Quality */}
                <TabsContent value="rag-quality" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                            <BrainCircuit className="w-5 h-5 text-emerald-600" /> Evaluación de Calidad RAG (RAGAS)
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Métricas de fidelidad, relevancia y precisión del contexto en tiempo real.
                        </p>
                    </div>
                    <RagQualityDashboard />
                </TabsContent>

                {/* Workflows */}
                <TabsContent value="workflows" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                            <GitFork className="w-5 h-5 text-purple-600" /> Editor de Flujos
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Diseñe agentes autónomos y pipelines de procesamiento visualmente.
                        </p>
                    </div>
                    {/* WorkflowCanvas needs height wrapper usually */}
                    <div className="h-[600px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                        <WorkflowCanvas />
                    </div>
                </TabsContent>

                {/* Placeholders for future modules */}
                <TabsContent value="predictive" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <LineChart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-800">Análisis Predictivo</h3>
                        <p className="text-slate-500 max-w-md mx-auto mt-2">
                            Módulo en construcción. Aquí aparecerán las predicciones de repuestos y mantenimiento.
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="playground" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-800">Prompt Playground</h3>
                        <p className="text-slate-500 max-w-md mx-auto mt-2">
                            Entorno seguro para probar y refinar prompts antes de desplegarlos a producción via PromptService.
                        </p>
                    </div>
                </TabsContent>

            </Tabs>
        </PageContainer>
    );
}
