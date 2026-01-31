"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import { ValidationWorkflow } from '@/components/entities/ValidationWorkflow';
import { Entity } from '@/lib/schemas';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AgentTraceViewer } from '@/components/agent/AgentTraceViewer';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react';

export default function ValidarPedidoPage() {
    const params = useParams();
    const id = params?.id as string;
    const { data: session } = useSession();
    const router = useRouter();

    // Core Data
    const [pedido, setPedido] = useState<Entity | null>(null);
    const [ragResults, setRagResults] = useState<any>(null);
    const [validationComplete, setValidationComplete] = useState(false);
    const [showAgentTrace, setShowAgentTrace] = useState(false);

    // UX State
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        async function loadData() {
            try {
                // 1. Cargar Entity
                const pedidoRes = await fetch(`/api/entities/${id}`);
                const pedidoData = await pedidoRes.json();
                if (pedidoData.pedido) {
                    setPedido(pedidoData.pedido);

                    // Simular resultados RAG (en producción vendrían del análisis)
                    setRagResults({
                        model: pedidoData.pedido.model || "Not detected",
                        orderNumber: pedidoData.pedido.identifier,
                        client: pedidoData.pedido.client || "Not specified",
                    });
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
        alert(`Validation saved successfully. Status: ${validacion.generalStatus}`);
        if (validacion.generalStatus === 'APPROVED') {
            router.push(`/entities/${id}`);
        }
    };

    const handleAgentComplete = async () => {
        // Recargar datos tras el análisis agéntico
        try {
            const pedidoRes = await fetch(`/api/entities/${id}`);
            const pedidoData = await pedidoRes.json();
            if (pedidoData.pedido) {
                setPedido(pedidoData.pedido);
                setRagResults({
                    model: pedidoData.pedido.model || "Detected by Agent",
                    orderNumber: pedidoData.pedido.identifier,
                    client: pedidoData.pedido.client || "Not specified",
                });
                setShowAgentTrace(false);
            }
        } catch (error) {
            console.error("Error reloading after agentic analysis:", error);
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
                        <Link href={`/entities`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Validación Técnica</h1>
                                <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-[10px] font-bold rounded uppercase tracking-wider">
                                    Entity {pedido?.identifier}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Estado: <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">{pedido?.status || 'ingresado'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                            href={`/entities/${id}`}
                            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
                        >
                            Ver Entity
                        </Link>
                    </div>
                ) : ragResults ? (
                    <ValidationWorkflow
                        entityId={id}
                        ragResults={ragResults}
                        onValidationComplete={handleValidationComplete}
                    />
                ) : (
                    <div className="max-w-2xl mx-auto space-y-8">
                        {!showAgentTrace ? (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center space-y-6">
                                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
                                <div>
                                    <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                                        Sin Resultados RAG
                                    </h2>
                                    <p className="text-amber-700 dark:text-amber-300">
                                        No se encontraron resultados del análisis previo. ¿Deseas iniciar el cerebro agéntico para analizar este pedido ahora?
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowAgentTrace(true)}
                                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-8 py-6 rounded-xl shadow-lg gap-2"
                                >
                                    <BrainCircuit size={20} /> Iniciar Razonamiento Agéntico
                                </Button>
                            </div>
                        ) : (
                            <AgentTraceViewer
                                correlationId={id}
                                onComplete={handleAgentComplete}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
