"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RagQualityDashboard from "@/components/admin/RagQualityDashboard";
import { WorkflowCanvas } from "@/components/workflow-editor/WorkflowCanvas";
import { useTranslations } from "next-intl";
import { BrainCircuit, Activity, GitFork, Sparkles, LineChart } from "lucide-react";

export default function AIHubPage() {
    const t = useTranslations('aiHub');
    const tTab = useTranslations('aiHub.tabs');
    const tSec = useTranslations('aiHub.sections');

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />

            <Tabs defaultValue="rag-quality" className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto flex justify-start">
                    <TabsTrigger value="rag-quality" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <Activity className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                        {tTab('ragQuality')}
                    </TabsTrigger>
                    <TabsTrigger value="workflows" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <GitFork className="w-4 h-4 text-purple-600" aria-hidden="true" />
                        {tTab('workflows')}
                    </TabsTrigger>
                    <TabsTrigger value="predictive" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <LineChart className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        {tTab('predictive')}
                    </TabsTrigger>
                    <TabsTrigger value="playground" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <Sparkles className="w-4 h-4 text-amber-600" aria-hidden="true" />
                        {tTab('playground')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="rag-quality" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                            <BrainCircuit className="w-5 h-5 text-emerald-600" aria-hidden="true" /> {tSec('ragQuality.title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {tSec('ragQuality.subtitle')}
                        </p>
                    </div>
                    <RagQualityDashboard />
                </TabsContent>

                <TabsContent value="workflows" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                            <GitFork className="w-5 h-5 text-purple-600" aria-hidden="true" /> {tSec('workflows.title')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {tSec('workflows.subtitle')}
                        </p>
                    </div>
                    <div className="h-[600px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                        <WorkflowCanvas />
                    </div>
                </TabsContent>

                <TabsContent value="predictive" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <LineChart className="w-16 h-16 text-slate-300 mx-auto mb-4" aria-hidden="true" />
                        <h3 className="text-xl font-bold text-slate-800">{tSec('predictive.title')}</h3>
                        <p className="text-slate-500 max-w-md mx-auto mt-2">
                            {tSec('predictive.subtitle')}
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="playground" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" aria-hidden="true" />
                        <h3 className="text-xl font-bold text-slate-800">{tSec('playground.title')}</h3>
                        <p className="text-slate-500 max-w-md mx-auto mt-2">
                            {tSec('playground.subtitle')}
                        </p>
                    </div>
                </TabsContent>

            </Tabs>
        </PageContainer>
    );
}
