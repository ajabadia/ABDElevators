"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ShieldCheck,
    ArrowLeft,
    Save,
    AlertTriangle,
    CheckCircle,
    Info,
    History,
    Clock,
    Loader2,
    Activity
} from 'lucide-react';
import { VectorResultsTable } from '@/components/tecnico/VectorResultsTable';
import { DynamicChecklist } from '@/components/tecnico/DynamicChecklist';
import { RagResult } from '@/lib/rag-service';
import { ChecklistConfig, ChecklistItem, Pedido } from '@/lib/schemas';
import { WorkflowStatusBar } from '@/components/workflow/WorkflowStatusBar';
import { WorkflowActions } from '@/components/workflow/WorkflowActions';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ValidarPedidoPage() {
    const params = useParams();
    const id = params?.id as string;
    const { data: session } = useSession();
    const router = useRouter();

    // Core Data
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [ragResults, setRagResults] = useState<RagResult[]>([]);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [config, setConfig] = useState<ChecklistConfig | null>(null);
    const [validationStates, setValidationStates] = useState<Record<string, { estado: 'OK' | 'REVISAR' | 'PENDIENTE'; notas?: string }>>({});

    // Workflow State
    const [workflowDef, setWorkflowDef] = useState<any>(null);

    // UX State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [startTime] = useState(Date.now());
    const [activeTab, setActiveTab] = useState<'validation' | 'timeline'>('validation');

    useEffect(() => {
        if (!id) return;

        async function loadData() {
            try {
                // 1. Cargar Pedido
                const pedidoRes = await fetch(`/api/pedidos/${id}`);
                const pedidoData = await pedidoRes.json();
                if (pedidoData.pedido) {
                    setPedido(pedidoData.pedido);
                }

                // 2. Cargar Vector Search
                const query = pedidoData.pedido?.numero_pedido || id;
                const vectorRes = await fetch(`/api/pedidos/${id}/vector-search?query=${encodeURIComponent(query)}&limit=10`);
                if (vectorRes.ok) {
                    const vectorData = await vectorRes.json();
                    setRagResults(vectorData.resultados || []);
                }

                // 3. Cargar Checklist
                const checklistRes = await fetch(`/api/pedidos/${id}/checklist`);
                if (checklistRes.ok) {
                    const checklistData = await checklistRes.json();
                    setChecklistItems(checklistData.items || []);
                    setConfig(checklistData.config);

                    // Inicializar estados de validación
                    const initialStates: any = {};
                    checklistData.items?.forEach((item: any) => {
                        initialStates[item.id] = { estado: 'PENDIENTE', notas: '' };
                    });
                    setValidationStates(initialStates);
                }

                // 4. Cargar Definición de Workflow (Fase 7.2)
                const workflowRes = await fetch(`/api/admin/workflow-definitions/active?entity_type=PEDIDO`);
                if (workflowRes.ok) {
                    const workflowData = await workflowRes.json();
                    setWorkflowDef(workflowData.definition);
                }

            } catch (error) {
                console.error("Error loading validation data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [id]);

    const handleItemUpdate = (itemId: string, updates: any) => {
        setValidationStates(prev => ({
            ...prev,
            [itemId]: updates
        }));
    };

    const handleInternalSave = async () => {
        setIsSaving(true);
        try {
            const checklist_final = Object.entries(validationStates).map(([itemId, state]) => ({
                itemId,
                estado: state.estado,
                notas: state.notas
            }));

            const payload = {
                resultados_rag_ids: ragResults.map(r => r.source),
                checklist_items: checklist_final,
                completa: checklist_final.every(i => i.estado !== 'PENDIENTE'),
                notas_generales: "",
                duracion_ms: Date.now() - startTime,
                firma_digital: `signed-by-${pedido?.numero_pedido}`
            };

            await fetch(`/api/pedidos/${id}/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            return true;
        } catch (error) {
            console.error("Error saving validation:", error);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Cargando motor de validación técnico...</p>
                </div>
            </div>
        );
    }

    const pendingCount = Object.values(validationStates).filter(v => v.estado === 'PENDIENTE').length;
    const progress = checklistItems.length > 0 ? ((checklistItems.length - pendingCount) / checklistItems.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 dark:bg-slate-950 transition-colors duration-500">
            {/* Header Barra Superior Premium */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={`/pedidos`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Validación Técnica</h1>
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider">
                                    Pedido {pedido?.numero_pedido}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                                <History className="h-3 w-3 mr-1" />
                                Estado: <span className="font-bold ml-1 text-slate-700 dark:text-slate-300 capitalize">{pedido?.estado || 'ingresado'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Tab Switcher */}
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <button
                                onClick={() => setActiveTab('validation')}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                                    activeTab === 'validation' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500"
                                )}
                            >
                                Validación
                            </button>
                            <button
                                onClick={() => setActiveTab('timeline')}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                                    activeTab === 'timeline' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500"
                                )}
                            >
                                Timeline
                            </button>
                        </div>

                        <div className="hidden lg:flex items-center gap-2 mr-4 text-sm font-medium">
                            <span className="text-slate-400">Progreso:</span>
                            <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">{Math.round(progress)}%</span>
                        </div>

                        <button
                            onClick={handleInternalSave}
                            disabled={isSaving}
                            className="inline-flex items-center px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all dark:text-slate-300 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="mr-2 h-4 w-4 text-blue-500" />}
                            Guardar Borrador
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                {/* Visualización del Workflow (Fase 7.2) */}
                {workflowDef && activeTab === 'validation' && (
                    <WorkflowStatusBar
                        states={workflowDef.states}
                        currentStateId={pedido?.estado || 'ingresado'}
                        transitions_history={pedido?.transitions_history || []}
                    />
                )}

                {activeTab === 'timeline' ? (
                    <div className="mt-8 max-w-3xl mx-auto">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <Activity className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Historial de Actividad del Workflow</h2>
                        </div>
                        <WorkflowTimeline logs={pedido?.transitions_history || []} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
                        {/* Panel Izquierdo: Documentación RAG */}
                        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h2 className="text-md font-bold text-slate-800 dark:text-white tracking-tight">Cruce RAG Automático</h2>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IA Engine</span>
                                </div>
                                <div className="p-4">
                                    <VectorResultsTable results={ragResults} />
                                </div>
                            </section>

                            {/* Alerta contextual */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/5 dark:to-orange-900/5 border border-amber-200/50 dark:border-amber-800/30 rounded-2xl p-5 shadow-sm">
                                <div className="flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
                                    <div>
                                        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wide">Protocolo Técnico</h4>
                                        <p className="text-xs text-amber-800 dark:text-amber-300/60 mt-1 leading-relaxed">
                                            Marca como <strong>REVISAR</strong> cualquier punto que presente discrepancias con la normativa técnica. Ingeniería revisará estas excepciones automáticamente.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Panel de Acciones de Workflow (Fase 7.2) */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-t-4 border-t-blue-500">
                                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Acciones de Workflow</h3>
                                    <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-mono text-slate-500">
                                        VER: 7.2.DYNAMIC
                                    </div>
                                </div>
                                {workflowDef && pedido && session?.user && (
                                    <WorkflowActions
                                        pedidoId={id}
                                        currentStateId={pedido.estado || 'ingresado'}
                                        transitions={workflowDef.transitions}
                                        userRole={session.user.role}
                                        onTransitionComplete={(newStatus) => {
                                            setPedido(prev => prev ? { ...prev, estado: newStatus } as Pedido : null);
                                            // Optional: show success toast
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Panel Derecho: Checklist Interactiva */}
                        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-900/10 dark:to-transparent">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-md font-bold text-slate-800 dark:text-white tracking-tight">Checklist de Puntos Críticos</h2>
                                            <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight mt-0.5">Validación Normativa Requerida</p>
                                        </div>
                                    </div>
                                    {pendingCount > 0 && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-full shadow-sm">
                                            <Clock className="h-3 w-3 text-blue-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{pendingCount} Pendientes</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    {config && (
                                        <DynamicChecklist
                                            items={checklistItems}
                                            config={config}
                                            onItemUpdate={handleItemUpdate}
                                            validationStates={validationStates}
                                        />
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer de información */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default text-center">
                <div className="flex items-center justify-center gap-2 text-[10px] font-medium text-slate-400">
                    <Info className="h-3 w-3" />
                    <span>Audit Trail enabled. Session: {id} | Tenant: {pedido?.tenantId} | Industry: {session?.user?.industry || 'GENERIC'}</span>
                </div>
            </div>
        </div>
    );
}
