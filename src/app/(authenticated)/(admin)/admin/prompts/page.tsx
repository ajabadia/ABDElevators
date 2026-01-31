'use client';

import React, { useState, useEffect } from 'react';
import {
    Terminal,
    Save,
    History,
    Play,
    Loader2,
    AlertTriangle,
    Code,
    Search,
    ChevronRight,
    Plus,
    Sparkles,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prompt } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PromptEditor } from '@/components/admin/PromptEditor';
import { PromptGlobalHistory } from '@/components/admin/PromptGlobalHistory';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

// Hooks y componentes genéricos
import { useApiList } from '@/hooks/useApiList';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useFormModal } from '@/hooks/useFormModal';

/**
 * AdminPromptsPage: Gestión de Prompts de IA.
 * Fase 7.6: Gestión Dinámica de Prompts.
 * Actualizado con Editor Pro y Visual UI.
 */
export default function AdminPromptsPage() {
    const modal = useFormModal<any>();
    const [searchQuery, setSearchQuery] = useState('');
    const [tenantFilter, setTenantFilter] = useState('all');
    const [uniqueTenants, setUniqueTenants] = useState<{ id: string, name: string }[]>([]);
    const [showGlobalHistory, setShowGlobalHistory] = useState(false);

    // 1. Gestión de datos con hook genérico
    const {
        data: prompts = [],
        isLoading: loading,
        refresh: fetchPrompts
    } = useApiList<any>({
        endpoint: '/api/admin/prompts',
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

    useEffect(() => {
        // Inicialización ya manejada por useApiList autoFetch por defecto si no se especifica?
        // useApiList tiene autoFetch: true por defecto si no se pasa.
    }, []);

    const filteredPrompts = prompts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.key.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTenant = tenantFilter === 'all' || p.tenantId === tenantFilter;
        return matchesSearch && matchesTenant;
    });

    const handleSaved = () => {
        modal.close();
        fetchPrompts();
        toast({ title: "Guardado", description: "El prompt se ha actualizado correctamente." });
    };

    return (
        <PageContainer className="h-full pb-10">
            {/* Header */}
            <PageHeader
                title="Motor de Prompts IA"
                highlight="Prompts"
                subtitle="Configura el razonamiento vectorial y la extracción de datos."
                actions={
                    <>
                        <Button
                            onClick={() => setShowGlobalHistory(true)}
                            variant="outline"
                            className="rounded-xl border-slate-200 dark:border-slate-800"
                        >
                            <History className="w-4 h-4 mr-2" /> Historial Global
                        </Button>
                        <Button onClick={modal.openCreate} className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Prompt
                        </Button>
                    </>
                }
            />

            <AnimatePresence>
                {showGlobalHistory && (
                    <PromptGlobalHistory onClose={() => setShowGlobalHistory(false)} />
                )}
            </AnimatePresence>

            {/* Layout Principal con Editor Pro */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[700px]">
                {/* List Sidebar */}
                <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
                    <ContentCard noPadding={true} className="flex flex-col h-full flex-grow bg-white dark:bg-slate-950 rounded-2xl">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    placeholder="Filtrar ingenierías..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs py-2 pl-9 h-11 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                                />
                            </div>

                            {uniqueTenants.length > 1 && (
                                <select
                                    value={tenantFilter}
                                    onChange={e => setTenantFilter(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider h-10 px-3 focus:border-teal-500 outline-none"
                                >
                                    <option value="all">Todas las Organizaciones</option>
                                    {uniqueTenants.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            )}
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
                                                        {!p.active && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                                INACTIVO
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <p className={cn("text-[10px] uppercase font-bold tracking-tighter opacity-50", modal.data === p && modal.isOpen ? "text-white" : "text-slate-400 font-mono")}>
                                                            {p.key}
                                                        </p>
                                                        <span className="text-[10px] opacity-20">|</span>
                                                        <p className={cn("text-[9px] font-bold tracking-tight italic", modal.data === p && modal.isOpen ? "text-white/70" : "text-teal-500/70")}>
                                                            {p.tenantInfo?.name || p.tenantId}
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
                                    <p className="text-sm font-bold tracking-tight">No se encontraron prompts</p>
                                </div>
                            )}
                        </div>
                    </ContentCard>

                    <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-all">
                            <Sparkles size={64} className="text-teal-500" />
                        </div>
                        <h4 className="text-white text-xs font-black uppercase tracking-[0.2em] mb-3">Sugerencia Pro</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            Los prompts con la categoría <strong>EXTRACTION</strong> afectarán directamente a los modelos detectados en el pipeline inicial. Valida siempre que mantengas los placeholders <code className="text-teal-500">{"{{text}}"}</code>.
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
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Control Maestro de Gemini</h3>
                                    <p className="text-xs text-slate-500 max-w-xs mt-2 mx-auto font-medium">
                                        Selecciona una ingeniería de prompt del listado lateral para desbloquear las capacidades de edición avanzada y visualización de versiones.
                                    </p>
                                </div>
                                <Button
                                    onClick={modal.openCreate}
                                    variant="outline"
                                    className="mt-6 rounded-2xl border-dashed border-2 hover:bg-slate-50 dark:hover:bg-slate-900"
                                >
                                    <Plus size={16} className="mr-2" /> Crear Primer Prompt Dinámico
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </ContentCard>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </PageContainer>
    );
}
