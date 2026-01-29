"use client";

import React from 'react';
import {
    GitBranch,
    Plus,
    Settings2,
    Shield,
    Save,
    Trash2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { WorkflowDefinition } from '@/lib/schemas';
import { WorkflowStatusBar } from '@/components/workflow/WorkflowStatusBar';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useApiItem } from '@/hooks/useApiItem';
import { useApiMutation } from '@/hooks/useApiMutation';

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

/**
 * AdminWorkflowPage: Gestión administrativa de Workflows.
 * Fase 7.2: Motor de Workflows Multinivel.
 */
export default function AdminWorkflowPage() {
    // 1. Carga de datos con hook genérico
    const {
        data: definition,
        setData: setDefinition,
        isLoading,
        refresh
    } = useApiItem<WorkflowDefinition>({
        endpoint: '/api/admin/workflow-definitions/active?entity_type=PEDIDO',
        dataKey: 'definition'
    });

    // 2. Acción de guardado con hook genérico
    const { mutate: saveWorkflow, isLoading: isSaving } = useApiMutation({
        endpoint: '/api/admin/workflow-definitions',
        successMessage: 'Workflow configurado correctamente.',
        onSuccess: () => refresh()
    });

    const handleSave = () => {
        if (definition) saveWorkflow(definition);
    };

    if (isLoading && !definition) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <PageContainer>
            {/* Header */}
            <PageHeader
                title="Gestión de Workflows"
                highlight="Workflows"
                subtitle="Define los estados, transiciones y reglas de negocio para tus procesos."
                actions={
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-500/20"
                    >
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Guardar Cambios
                    </Button>
                }
            />

            {/* Preview */}
            <ContentCard className="relative overflow-hidden p-8">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <GitBranch className="w-32 h-32" />
                </div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Vista Previa del Flujo</h3>
                {definition && (
                    <WorkflowStatusBar
                        states={definition.states}
                        currentStateId={definition.initial_state}
                        transitions_history={[]}
                    />
                )}
            </ContentCard>

            {/* Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
                {/* States Editor */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-500" />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Estados del Workflow</h2>
                            </div>
                            <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 gap-1 font-bold">
                                <Plus className="w-4 h-4" /> Añadir Estado
                            </Button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {definition?.states.map((state) => (
                                    <motion.div
                                        key={state.id}
                                        layoutId={state.id}
                                        className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                                                style={{ backgroundColor: state.color }}
                                            >
                                                <Settings2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{state.label}</p>
                                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter opacity-70">{state.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-blue-500 transition-colors">
                                                <Settings2 className="w-4 h-4" />
                                            </Button>
                                            {!state.is_initial && !state.is_final && (
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Rules & Constraints */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-6">
                    <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-teal-500/20 transition-all duration-700" />

                        <h3 className="text-lg font-black mb-6 flex items-center gap-2 tracking-tight">
                            <CheckCircle2 className="w-5 h-5 text-teal-400" />
                            Reglas Globales
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-black uppercase tracking-widest text-teal-400/60 mb-2">Estado Inicial</p>
                                <p className="text-sm font-bold font-mono">{definition?.initial_state}</p>
                            </div>
                            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <p className="text-[10px] font-black uppercase tracking-widest text-teal-400/60 mb-2">Entidad Target</p>
                                <p className="text-sm font-bold font-mono">{definition?.entity_type}</p>
                            </div>
                        </div>
                    </section>

                    <div className="p-6 bg-amber-500/5 dark:bg-amber-900/10 border border-amber-500/10 rounded-3xl">
                        <div className="flex gap-4">
                            <div className="p-2 bg-amber-500/20 rounded-xl h-fit">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">Impacto Administrativo</h4>
                                <p className="text-[11px] text-amber-800/70 dark:text-amber-400/60 leading-relaxed">
                                    Los cambios en el workflow afectan a todos los casos activos de este tenant. Asegúrate de que las transiciones sean compatibles con el historial existente.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
