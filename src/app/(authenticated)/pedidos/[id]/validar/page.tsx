"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import { ValidationWorkflow } from '@/components/pedidos/ValidationWorkflow';
import { Pedido } from '@/lib/schemas';
import { WorkflowStatusBar } from '@/components/workflow/WorkflowStatusBar';
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
    const [ragResults, setRagResults] = useState<any>(null);
    const [validationComplete, setValidationComplete] = useState(false);

    // Workflow State
    const [workflowDef, setWorkflowDef] = useState<any>(null);

    // UX State
    const [isLoading, setIsLoading] = useState(true);
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

                    // Simular resultados RAG (en producción vendrían del análisis)
                    // Aquí deberías cargar los resultados reales del RAG
                    setRagResults({
                        modelo: pedidoData.pedido.modelo || "No detectado",
                        numero_pedido: pedidoData.pedido.numero_pedido,
                        cliente: pedidoData.pedido.cliente || "No especificado",
                        // Añade más campos según tu análisis RAG
                    });
                }

                // 2. Cargar Definición de Workflow
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

    const handleValidationComplete = (validacion: any) => {
        setValidationComplete(true);

        // Mostrar mensaje de éxito
        alert(`Validación guardada exitosamente. Estado: ${validacion.estadoGeneral}`);

        // Opcional: Redirigir o actualizar el pedido
        if (validacion.estadoGeneral === 'APROBADO') {
            router.push(`/pedidos/${id}`);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Cargando motor de validación...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 dark:bg-slate-950">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={`/pedidos`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Validación Técnica</h1>
                                <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px] font-bold rounded uppercase tracking-wider">
                                    Pedido {pedido?.numero_pedido}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Estado: <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{pedido?.estado || 'ingresado'}</span>
                            </p>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                            onClick={() => setActiveTab('validation')}
                            className={cn(
                                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                                activeTab === 'validation' ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm" : "text-slate-500"
                            )}
                        >
                            Validación
                        </button>
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={cn(
                                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                                activeTab === 'timeline' ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm" : "text-slate-500"
                            )}
                        >
                            Timeline
                        </button>
                    </div>
                </div>
            </div>

            {/* Workflow Status Bar */}
            {workflowDef && pedido && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <WorkflowStatusBar
                        currentState={pedido.estado || 'ingresado'}
                        workflowDefinition={workflowDef}
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'validation' ? (
                    <>
                        {validationComplete ? (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center">
                                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                                    Validación Completada
                                </h2>
                                <p className="text-emerald-700 dark:text-emerald-300 mb-6">
                                    La validación ha sido guardada exitosamente en el sistema.
                                </p>
                                <Link
                                    href={`/pedidos/${id}`}
                                    className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
                                >
                                    Ver Pedido
                                </Link>
                            </div>
                        ) : ragResults ? (
                            <ValidationWorkflow
                                pedidoId={id}
                                ragResults={ragResults}
                                onValidationComplete={handleValidationComplete}
                            />
                        ) : (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center">
                                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                                    Sin Resultados RAG
                                </h2>
                                <p className="text-amber-700 dark:text-amber-300">
                                    No se encontraron resultados del análisis RAG para este pedido.
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <WorkflowTimeline
                        entityId={id}
                        entityType="PEDIDO"
                    />
                )}
            </div>
        </div>
    );
}
