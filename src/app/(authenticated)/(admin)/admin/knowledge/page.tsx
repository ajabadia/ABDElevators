"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeAssetsManager } from "@/components/admin/knowledge/KnowledgeAssetsManager";
import { KnowledgeExplorer } from "@/components/admin/knowledge/KnowledgeExplorer";
import { SpaceManager } from "@/components/admin/knowledge/SpaceManager";
import { useTranslations } from "next-intl";
import {
    FileText,
    Search,
    Globe,
    FolderOpen,
    BrainCircuit
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function KnowledgeHubPage() {
    const t = useTranslations('knowledge_hub'); // We might need to add this namespace or reuse others
    const { data: session } = useSession();

    // Fallback translation if namespace missing (or use 'common')
    // Ideally user adds keys to es.json
    const title = "Centro de Conocimiento";
    const subtitle = "Gestión unificada de activos, exploración semántica y espacios de trabajo.";

    return (
        <PageContainer>
            <PageHeader
                title={title}
                subtitle={subtitle}
            />

            <Tabs defaultValue="explorer" className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto flex justify-start">
                    <TabsTrigger value="explorer" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <Search className="w-4 h-4" />
                        Explorador Neural
                    </TabsTrigger>
                    <TabsTrigger value="assets" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <FileText className="w-4 h-4" />
                        Gestión Activos
                    </TabsTrigger>
                    <TabsTrigger value="my-docs" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <FolderOpen className="w-4 h-4" />
                        Mis Documentos
                    </TabsTrigger>
                    <TabsTrigger value="spaces" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm min-w-[140px]">
                        <Globe className="w-4 h-4" />
                        Espacios
                    </TabsTrigger>
                </TabsList>

                {/* Explorador (KnowledgeExplorer) */}
                <TabsContent value="explorer" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                            <BrainCircuit className="w-5 h-5 text-teal-600" /> Motor de Búsqueda Semántica
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Explore chunks vectorizados, simule consultas RAG y audite la calidad de la recuperación.
                        </p>
                    </div>
                    <KnowledgeExplorer />
                </TabsContent>

                {/* Gestión Activos (Admin View) */}
                <TabsContent value="assets" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <KnowledgeAssetsManager scope="all" />
                </TabsContent>

                {/* Mis Documentos (User View) */}
                <TabsContent value="my-docs" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <KnowledgeAssetsManager scope="user" userId={session?.user?.id} />
                </TabsContent>

                {/* Espacios */}
                <TabsContent value="spaces" className="animate-in fade-in slide-in-from-bottom-4 outline-none">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                            <Globe className="w-5 h-5 text-blue-600" /> Espacios de Conocimiento
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Configure límites de contexto y permisos de acceso para grupos de documentos.
                        </p>
                    </div>
                    <SpaceManager />
                </TabsContent>
            </Tabs>
        </PageContainer>
    );
}
