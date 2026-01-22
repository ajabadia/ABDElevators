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
    Clock
} from 'lucide-react';
import { VectorResultsTable } from '@/components/tecnico/VectorResultsTable';
import { DynamicChecklist } from '@/components/tecnico/DynamicChecklist';
import { RagResult } from '@/lib/rag-service';
import { ChecklistConfig, ChecklistItem, Pedido } from '@/lib/schemas';
import Link from 'next/link';

export default function ValidarPedidoPage() {
    const { id } = useParams();
    const router = useRouter();
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [ragResults, setRagResults] = useState<RagResult[]>([]);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [config, setConfig] = useState<ChecklistConfig | null>(null);
    const [validationStates, setValidationStates] = useState<Record<string, { estado: 'OK' | 'REVISAR' | 'PENDIENTE'; notas?: string }>>({});

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [startTime] = useState(Date.now());

    useEffect(() => {
        async function loadData() {
            try {
                // 1. Cargar Pedido
                const pedidoRes = await fetch(`/api/pedidos/${id}`);
                const pedidoData = await pedidoRes.json();
                setPedido(pedidoData.pedido);

                // 2. Cargar Vector Search (Phase 6.1 endpoint)
                const vectorRes = await fetch(`/api/pedidos/${id}/vector-search?query=${encodeURIComponent(pedidoData.pedido.numero_pedido)}&limit=10`);
                const vectorData = await vectorRes.json();
                setRagResults(vectorData.resultados);

                // 3. Cargar Checklist (Phase 6 endpoint)
                const checklistRes = await fetch(`/api/pedidos/${id}/checklist`);
                const checklistData = await checklistRes.json();
                setChecklistItems(checklistData.items);
                setConfig(checklistData.config);

                // Inicializar estados de validación
                const initialStates: any = {};
                checklistData.items.forEach((item: any) => {
                    initialStates[item.id] = { estado: 'PENDIENTE', notas: '' };
                });
                setValidationStates(initialStates);

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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const checklist_final = Object.entries(validationStates).map(([itemId, state]) => ({
                itemId,
                estado: state.estado,
                notas: state.notas
            }));

            const payload = {
                resultados_rag_ids: ragResults.map(r => r.source), // Snapshot de fuentes
                checklist_items: checklist_final,
                completa: checklist_final.every(i => i.estado !== 'PENDIENTE'),
                notas_generales: "",
                duracion_ms: Date.now() - startTime,
                firma_digital: `signed-by-${pedido?.numero_pedido}`
            };

            const res = await fetch(`/api/pedidos/${id}/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push(`/pedidos/${id}`);
            }
        } catch (error) {
            console.error("Error saving validation:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Cargando motor de validación...</div>;
    }

    const pendingCount = Object.values(validationStates).filter(v => v.estado === 'PENDIENTE').length;
    const isFullyValidated = pendingCount === 0;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Barra Superior con Dashboard de Estado */}
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={`/pedidos/${id}`} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900">Validación Técnica</h1>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">
                                    Pedido {pedido?.numero_pedido}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                                <History className="h-3 w-3 mr-1" />
                                Iniciado hace {Math.floor((Date.now() - startTime) / 60000)} min
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex items-center gap-2 mr-4 text-sm font-medium">
                            <span className="text-slate-400">Progreso:</span>
                            <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${((checklistItems.length - pendingCount) / checklistItems.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-blue-600">{checklistItems.length - pendingCount}/{checklistItems.length}</span>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md ${isFullyValidated
                                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {isSaving ? 'Guardando...' : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Finalizar y Firmar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Panel Izquierdo: Documentación RAG */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Cruce RAG Automático</h2>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top 10 Relevancia</span>
                        </div>
                        <VectorResultsTable results={ragResults} />
                    </section>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Atención al Técnico</h4>
                                <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                                    Si encuentras dudas en la documentación oficial para algún punto de la checklist, márcalo como <strong>REVISAR</strong> y añade una nota explicativa. Esto alertará automáticamente a Ingeniería.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Checklist Interactiva */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Validación de Puntos Críticos</h2>
                            </div>
                            {pendingCount > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm animate-pulse">
                                    <Clock className="h-3 w-3 text-blue-500" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{pendingCount} Pendientes</span>
                                </div>
                            )}
                        </div>

                        {config && (
                            <DynamicChecklist
                                items={checklistItems}
                                config={config}
                                onItemUpdate={handleItemUpdate}
                                validationStates={validationStates}
                            />
                        )}
                    </section>
                </div>
            </div>

            {/* Footer de información */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Info className="h-4 w-4" />
                    <span>Audit Trail enabled. Session: {id} | Tenant: {pedido?.tenantId} | Materia: ELEVATORS</span>
                </div>
            </div>
        </div>
    );
}
