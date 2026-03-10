'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Terminal,
    Save,
    History,
    Play,
    Loader2,
    AlertTriangle,
    Search,
    ChevronRight,
    Plus,
    Sparkles,
    Trash2,
    Rocket,
    X,
    Filter,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prompt } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PromptEditor } from '@/components/admin/PromptEditor';
import { PromptGlobalHistory } from '@/components/admin/PromptGlobalHistory';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { useEnvironmentStore } from '@/store/environment-store';

// Hooks y componentes genéricos
import { useApiList } from '@/hooks/useApiList';
import { useFormModal } from '@/hooks/useFormModal';

// Componentes Refactorizados (Fase 345)
import { PromptFilters } from './components/PromptFilters';
import { PromptList, type PromptWithInfo } from './components/PromptList';
import { PromptSyncPortal } from './components/PromptSyncPortal';

/**
 * 📝 Prompts Hub Client Component
 * SRP: Actúa como Contenedor/Orquestador de la lógica de prompts.
 */
export function PromptsHubClient() {
    const t = useTranslations('admin_prompts');
    const modal = useFormModal<PromptWithInfo>();

    // Estados de filtrado persistidos en el contenedor para orquestación
    const [searchQuery, setSearchQuery] = useState('');
    const [tenantFilter, setTenantFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [industryFilter, setIndustryFilter] = useState('all');
    const [uniqueTenants, setUniqueTenants] = useState<{ id: string, name: string }[]>([]);
    const [showGlobalHistory, setShowGlobalHistory] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const { environment } = useEnvironmentStore();

    // Categorías disponibles (Metadata)
    const CATEGORIES = ['EXTRACTION', 'ANALYSIS', 'RISK', 'CHECKLIST', 'GENERAL', 'ROUTING'];

    // 1. Gestión de datos con hook genérico
    const {
        data: prompts = [],
        isLoading: loading,
        refresh: fetchPrompts
    } = useApiList<PromptWithInfo>({
        endpoint: '/api/admin/prompts',
        filters: { environment },
        autoFetch: true,
        dataKey: 'prompts',
        onSuccess: (data) => {
            if (data && data.length > 0) {
                const tenantsList = data.map((p: PromptWithInfo) => ({
                    id: p.tenantId,
                    name: p.tenantInfo?.name || p.tenantId
                }));
                const unique = Array.from(new Map(tenantsList.map((item: { id: string, name: string }) => [item.id, item])).values()) as { id: string, name: string }[];
                setUniqueTenants(unique);
            }
        }
    });

    // 2. Lógica de Filtrado (Calculada bajo demanda / Memoizable si fuera necesario)
    const filteredPrompts = prompts.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesTenant = tenantFilter === 'all' || p.tenantId === tenantFilter;
        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
        const matchesIndustry = industryFilter === 'all' || p.industry === industryFilter;

        return matchesSearch && matchesTenant && matchesCategory && matchesIndustry;
    });

    const categoryCounts = filteredPrompts.reduce((acc: Record<string, number>, p: PromptWithInfo) => {
        const cat = p.category || 'GENERAL';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const handleSaved = () => {
        modal.close();
        fetchPrompts();
        toast.success(t('messages.save_success'));
    };

    return (
        <PageContainer className="h-full pb-10">
            {/* Header / Toolbar Principal */}
            <PageHeader
                title={t('title')}
                highlight="Prompts"
                subtitle={t('subtitle')}
                actions={
                    <>
                        <Button
                            onClick={() => setShowGlobalHistory(true)}
                            variant="outline"
                            className="rounded-xl border-slate-200 dark:border-slate-800"
                        >
                            <History className="w-4 h-4 mr-2" /> {t('actions.history')}
                        </Button>

                        <PromptSyncPortal
                            isSyncing={isSyncing}
                            setIsSyncing={setIsSyncing}
                            fetchPrompts={fetchPrompts}
                            environment={environment}
                            selectedPromptId={modal.isOpen ? modal.data?._id : undefined}
                        />

                        <Button onClick={modal.openCreate} className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold">
                            <Plus className="w-4 h-4 mr-2" /> {t('new_prompt')}
                        </Button>
                    </>
                }
            />

            <AnimatePresence>
                {showGlobalHistory && (
                    <PromptGlobalHistory onClose={() => setShowGlobalHistory(false)} />
                )}
            </AnimatePresence>

            {/* Layout de Contenidos: Listado + Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[700px]">

                {/* Lateral Izquierdo: Filtros y Lista */}
                <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
                    <ContentCard noPadding={true} className="flex flex-col h-full flex-grow bg-white dark:bg-slate-950 rounded-2xl">

                        <PromptFilters
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            tenantFilter={tenantFilter}
                            setTenantFilter={setTenantFilter}
                            categoryFilter={categoryFilter}
                            setCategoryFilter={setCategoryFilter}
                            industryFilter={industryFilter}
                            setIndustryFilter={setIndustryFilter}
                            uniqueTenants={uniqueTenants}
                            promptsCount={prompts.length}
                            categoryCounts={categoryCounts}
                            categories={CATEGORIES}
                        />

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <PromptList
                                prompts={filteredPrompts}
                                loading={loading}
                                selectedPromptId={modal.data?._id || modal.data?.key}
                                onSelect={modal.openEdit}
                            />
                        </div>
                    </ContentCard>

                    {/* Banner de Info / Status */}
                    <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-all">
                            <Sparkles size={64} className="text-teal-500" />
                        </div>
                        <h4 className="text-white text-xs font-black uppercase tracking-[0.2em] mb-3">Multi-Vertical RAG</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            {t('info.multi_vertical')}
                        </p>
                    </div>
                </div>

                {/* Área Central: Editor Pro */}
                <ContentCard noPadding={true} className="lg:col-span-12 xl:col-span-8 flex flex-col h-full bg-slate-100/50 dark:bg-slate-900/20 p-1 rounded-2xl">
                    <AnimatePresence mode="wait">
                        {modal.isOpen ? (
                            <div className="h-full">
                                <PromptEditor
                                    key={modal.data ? modal.data._id || modal.data.key : 'new-prompt'}
                                    initialPrompt={modal.data || undefined}
                                    onSaved={handleSaved}
                                    onCancel={() => modal.close()}
                                />
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center p-20 text-center space-y-4"
                            >
                                <div className="w-20 h-20 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center mb-4">
                                    <Sparkles size={32} className="text-slate-300 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('editor_placeholder_title')}</h3>
                                    <p className="text-xs text-slate-500 max-w-xs mt-2 mx-auto font-medium">
                                        {t('editor_placeholder_desc')}
                                    </p>
                                </div>
                                <Button
                                    onClick={modal.openCreate}
                                    variant="outline"
                                    className="mt-6 rounded-2xl border-dashed border-2 hover:bg-slate-50 dark:hover:bg-slate-900"
                                >
                                    <Plus size={16} className="mr-2" /> {t('actions.create_first')}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </ContentCard>
            </div>

        </PageContainer>
    );
}
