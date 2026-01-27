"use client";

import React, { useState, useEffect } from 'react';
import {
    GitBranch,
    Plus,
    Settings2,
    Shield,
    Save,
    Loader2,
    Trash2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { WorkflowDefinition, WorkflowState } from '@/lib/schemas';
import { WorkflowStatusBar } from '@/components/workflow/WorkflowStatusBar';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * AdminWorkflowPage: Gestión administrativa de Workflows.
 * Fase 7.2: Motor de Workflows Multinivel.
 */
export default function AdminWorkflowPage() {
    const { data: session } = useSession();
    const [definition, setDefinition] = useState<WorkflowDefinition | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadWorkflow() {
            try {
                const res = await fetch('/api/admin/workflow-definitions/active?entity_type=PEDIDO');
                if (res.ok) {
                    const data = await res.json();
                    setDefinition(data.definition);
                }
            } catch (error) {
                console.error("Error loading workflow:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadWorkflow();
    }, []);

    const handleSave = async () => {
        if (!definition) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/workflow-definitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(definition)
            });
            if (res.ok) {
                toast({ title: "Workflow guardado", description: "La configuración se ha actualizado correctamente." });
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar el workflow.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Gestión de <span className="text-teal-600">Workflows</span>
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Define los estados, transiciones y reglas de negocio para tus procesos.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar Cambios
                </button>
            </div>

            {/* Preview */}
            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <GitBranch className="w-32 h-32" />
                </div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Vista Previa del Flujo</h3>
                {definition && (
                    <WorkflowStatusBar
                        states={definition.states}
                        currentStateId={definition.initial_state}
                        transitions_history={[]}
                    />
                )}
            </section>

            {/* Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* States Editor */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-500" />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Estados del Workflow</h2>
                            </div>
                            <button className="text-sm font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1">
                                <Plus className="w-4 h-4" /> Añadir Estado
                            </button>
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
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                                                style={{ backgroundColor: state.color }}
                                            >
                                                <Settings2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{state.label}</p>
                                                <p className="text-[10px] text-slate-500 font-mono uppercase">{state.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-500 transition-colors">
                                                <Settings2 className="w-4 h-4" />
                                            </button>
                                            {!state.is_initial && !state.is_final && (
                                                <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
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
                    <section className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-500/20">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Reglas Globales
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Estado Inicial</p>
                                <p className="text-sm font-medium">{definition?.initial_state}</p>
                            </div>
                            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">Entidad Target</p>
                                <p className="text-sm font-medium">{definition?.entity_type}</p>
                            </div>
                        </div>
                    </section>

                    <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-3xl">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                            <p className="text-xs text-amber-800 dark:text-amber-400/80 leading-relaxed font-medium">
                                <strong>Importante:</strong> Los cambios en el workflow afectan a todos los casos activos de este tenant. Asegúrate de que las transiciones sean compatibles con el historial existente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
