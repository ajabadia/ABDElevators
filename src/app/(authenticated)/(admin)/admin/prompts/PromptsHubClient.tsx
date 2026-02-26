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
import { useApiMutation } from '@/hooks/useApiMutation';
import { useFormModal } from '@/hooks/useFormModal';

/**
 * 📝 Prompts Hub Client Component
 */
export function PromptsHubClient() {
    const t = useTranslations('admin.prompts');
    const modal = useFormModal<any>();
    const [searchQuery, setSearchQuery] = useState('');
    const [tenantFilter, setTenantFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [industryFilter, setIndustryFilter] = useState('all');
    const [uniqueTenants, setUniqueTenants] = useState<{ id: string, name: string }[]>([]);
    const [showGlobalHistory] = useState(false); // Refactored to not use setShowGlobalHistory if not needed locally or pass to modal
    const [_showGlobalHistory, setShowGlobalHistory] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const { environment } = useEnvironmentStore();

    // Categorías disponibles
    const CATEGORIES = ['EXTRACTION', 'ANALYSIS', 'RISK', 'CHECKLIST', 'GENERAL', 'ROUTING'];

    // 1. Gestión de datos con hook genérico
    const {
        data: prompts = [],
        isLoading: loading,
        refresh: fetchPrompts
    } = useApiList<any>({
        endpoint: '/api/admin/prompts',
        filters: { environment },
        autoFetch: true,
        dataKey: 'prompts',
        onSuccess: (data) => {
            if (data && data.length > 0) {
                const tenantsList = data.map((p: any) => ({
                    id: p.tenantId,
                    name: p.tenantInfo?.name || p.tenantId
                }));
                const unique = Array.from(new Map(tenantsList.map((item: any) => [item.id, item])).values()) as any[];
                setUniqueTenants(unique);
            }
        }
    });

    // 2. Lógica de Filtrado y Contadores
    const filteredPrompts = prompts.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesTenant = tenantFilter === 'all' || p.tenantId === tenantFilter;
        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
        const matchesIndustry = industryFilter === 'all' || p.industry === industryFilter;

        return matchesSearch && matchesTenant && matchesCategory && matchesIndustry;
    });

    const categoryCounts = filteredPrompts.reduce((acc: any, p: any) => {
        const cat = p.category || 'GENERAL';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const clearFilters = () => {
        setSearchQuery('');
        setTenantFilter('all');
        setCategoryFilter('all');
        setIndustryFilter('all');
    };

    const handleSaved = () => {
        modal.close();
        fetchPrompts();
        toast.success(t('messages.save_success'));
    };

    const handleSyncFromCode = async () => {
        try {
            setIsSyncing(true);
            const res = await fetch('/api/admin/prompts/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const json = await res.json();

            if (!res.ok || !json.success) throw new Error(json.message || "Error en la sincronización sincronización");

            // Actualizar lista
            fetchPrompts();

            toast.success("Gobernanza Actualizada", {
                description: `Sincronización completada. Creados: ${json.stats?.created ?? json.results?.created}, Actualizados: ${json.stats?.updated ?? json.results?.updated}.`
            });
        } catch (error: any) {
            console.error('Sync Error:', error);
            toast.error(t('messages.sync_error'), {
                description: error.message
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handlePromote = async () => {
        if (!modal.data) return;
        try {
            const res = await fetch(`/api/admin/environments/promote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'PROMPT',
                    id: (modal.data as any)._id
                })
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            toast.success(t('messages.promote_success'), { description: t('messages.promote_desc') });
        } catch (err: any) {
            toast.error("Error", { description: err.message });
        }
    };

    return (
        <PageContainer className="h-full pb-10">
            {/* Header */}
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
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    disabled={isSyncing}
                                    variant="outline"
                                    className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/10"
                                >
                                    {isSyncing ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 mr-2" />
                                    )}
                                    {t('sync')}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2rem] border-slate-100 dark:border-slate-800">
                                <AlertDialogHeader>
                                    <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-4">
                                        <ShieldCheck className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <AlertDialogTitle className="text-2xl font-black tracking-tight">
                                        {t('sync_modal.title')}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-base text-muted-foreground">
                                        {t('sync_modal.description', { codePath: 'src/lib/prompts.ts' })}
                                        <br /><br />
                                        <span className="font-bold text-foreground">{t('sync_modal.governance')}</span> {t('sync_modal.governance_desc')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel className="rounded-xl h-12 font-bold">{t('sync_modal.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleSyncFromCode}
                                        className="rounded-xl h-12 font-bold bg-teal-600 hover:bg-teal-700 text-white"
                                    >
                                        {t('sync_modal.confirm')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        {environment === 'STAGING' && modal.isOpen && modal.data && (
                            <Button
                                onClick={handlePromote}
                                variant="outline"
                                className="rounded-xl border-amber-200 bg-amber-50 dark:bg-amber-900/10 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                            >
                                <Rocket className="w-4 h-4 mr-2" /> {t('actions.promote')}
                            </Button>
                        )}
                        <Button onClick={modal.openCreate} className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold">
                            <Plus className="w-4 h-4 mr-2" /> {t('new_prompt')}
                        </Button>
                    </>
                }
            />

            <AnimatePresence>
                {_showGlobalHistory && (
                    <PromptGlobalHistory onClose={() => setShowGlobalHistory(false)} />
                )}
            </AnimatePresence>

            {/* Layout Principal con Editor Pro */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[700px]">
                {/* List Sidebar */}
                <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
                    <ContentCard noPadding={true} className="flex flex-col h-full flex-grow bg-white dark:bg-slate-950 rounded-2xl">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        placeholder={t('search_placeholder')}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs py-2 pl-9 h-11 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                                    />
                                </div>
                                {(searchQuery || tenantFilter !== 'all' || categoryFilter !== 'all' || industryFilter !== 'all') && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={clearFilters}
                                        className="rounded-xl text-slate-400 hover:text-rose-500"
                                        title={t('actions.clear_filters')}
                                    >
                                        <X size={18} />
                                    </Button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                    onClick={() => setCategoryFilter('all')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border",
                                        categoryFilter === 'all'
                                            ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20"
                                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-teal-500/50"
                                    )}
                                >
                                    {t('filters.all')} ({prompts.length})
                                </button>
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-2",
                                            categoryFilter === cat
                                                ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20"
                                                : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-teal-500/50"
                                        )}
                                    >
                                        {cat}
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded-md text-[9px]",
                                            categoryFilter === cat ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                        )}>
                                            {categoryCounts[cat] || 0}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {uniqueTenants.length > 1 && (
                                    <select
                                        value={tenantFilter}
                                        onChange={e => setTenantFilter(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider h-10 px-3 focus:border-teal-500 outline-none"
                                    >
                                        <option value="all">{t('filters.organization')}</option>
                                        {uniqueTenants.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                )}
                                <select
                                    value={industryFilter}
                                    onChange={e => setIndustryFilter(e.target.value)}
                                    className="w-full bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-800 rounded-xl text-[10px] font-bold uppercase tracking-wider h-10 px-3 focus:border-teal-500 outline-none text-teal-700 dark:text-teal-400"
                                >
                                    <option value="all">{t('industries.all')}</option>
                                    <option value="GENERIC">{t('industries.GENERIC')}</option>
                                    <option value="ELEVATORS">{t('industries.ELEVATORS')}</option>
                                    <option value="LEGAL">{t('industries.LEGAL')}</option>
                                    <option value="BANKING">{t('industries.BANKING')}</option>
                                    <option value="INSURANCE">{t('industries.INSURANCE')}</option>
                                    <option value="IT">{t('industries.IT')}</option>
                                    <option value="MEDICAL">{t('industries.MEDICAL')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {loading ? (
                                <div className="p-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500 opacity-20" />
                                </div>
                            ) : filteredPrompts.length > 0 ? (
                                <div className="space-y-1">
                                    {filteredPrompts.map(p => (
                                        <div
                                            key={(p as any)._id}
                                            onClick={() => modal.openEdit(p)}
                                            className={cn(
                                                "p-4 rounded-2xl cursor-pointer transition-all group relative flex items-center justify-between",
                                                modal.data === p && modal.isOpen
                                                    ? "bg-teal-600 shadow-md shadow-teal-500/20"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-900"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all overflow-hidden border",
                                                    modal.data === p && modal.isOpen ? "bg-white/20 border-white/20" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                                )}>
                                                    {p.tenantInfo?.branding?.logo?.url ? (
                                                        <img src={p.tenantInfo.branding.logo.url} alt="" className="w-full h-full object-contain p-1" />
                                                    ) : (
                                                        <div className={cn(
                                                            "w-full h-full flex items-center justify-center text-[10px] font-black uppercase",
                                                            modal.data === p && modal.isOpen ? "text-white" : "text-slate-400"
                                                        )}>
                                                            {(p.tenantInfo?.name || p.tenantId).substring(0, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className={cn("text-xs font-black tracking-tight flex items-center gap-1", modal.data === p && modal.isOpen ? "text-white" : "text-slate-900 dark:text-white")}>
                                                            {p.name}
                                                            {(p as any)._validationError && (
                                                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                                            )}
                                                        </h3>
                                                        <span className={cn(
                                                            "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                                            modal.data === p && modal.isOpen ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                        )}>
                                                            V{p.version}
                                                        </span>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[8px] h-4 py-0",
                                                            p.industry === 'ELEVATORS' ? "text-blue-500 border-blue-500/20" :
                                                                p.industry === 'LEGAL' ? "text-purple-500 border-purple-500/20" :
                                                                    p.industry === 'BANKING' ? "text-emerald-500 border-emerald-500/20" :
                                                                        p.industry === 'INSURANCE' ? "text-rose-500 border-rose-500/20" :
                                                                            "text-slate-500 border-slate-500/20"
                                                        )}>
                                                            {p.industry || 'GENERIC'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <p className={cn("text-[10px] uppercase font-bold tracking-tighter opacity-50", modal.data === p && modal.isOpen ? "text-white" : "text-slate-400 font-mono")}>
                                                            {p.key}
                                                        </p>
                                                        <span className="text-[10px] opacity-20">|</span>
                                                        <p className={cn("text-[10px] font-black tracking-widest text-teal-500", modal.data === p && modal.isOpen ? "text-white/70" : "")}>
                                                            {p.category}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className={cn("w-4 h-4 transition-all", modal.data === p && modal.isOpen ? "text-white" : "text-slate-300 group-hover:text-teal-400")} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 text-center opacity-40">
                                    <Search size={40} className="mx-auto mb-4" />
                                    <p className="text-sm font-bold tracking-tight">{t('messages.no_prompts')}</p>
                                </div>
                            )}
                        </div>
                    </ContentCard>

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

                {/* Editor Container Section */}
                <ContentCard noPadding={true} className="lg:col-span-12 xl:col-span-8 flex flex-col h-full bg-slate-100/50 dark:bg-slate-900/20 p-1 rounded-2xl">
                    <AnimatePresence mode="wait">
                        {modal.isOpen ? (
                            <div className="h-full">
                                <PromptEditor
                                    key={modal.data ? (modal.data as any)._id || modal.data.key : 'new-prompt'}
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
