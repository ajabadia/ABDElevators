"use client";

import React from 'react';
import { InsightPanel } from '@/components/shared/InsightPanel';
import { ContentCard } from '@/components/ui/content-card';
import { BrainCircuit, LineChart, ShieldAlert } from 'lucide-react';

export function ProactiveInsightsSection() {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-950 rounded-lg">
                        <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inteligencia Proactiva</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Detección temprana de fallos y recomendaciones de mantenimiento.</p>
                    </div>
                </div>

                <InsightPanel />
            </div>

            <div className="space-y-6">
                <ContentCard
                    title="Análisis de Tendencias"
                    description="Basado en los últimos 30 días de actividad técnica."
                    icon={<LineChart className="text-indigo-500" size={18} />}
                >
                    <div className="space-y-4 py-2">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-500 uppercase">Salud del Sistema</span>
                                <span className="text-xs font-bold text-emerald-500">98.2%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[98.2%]" />
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-500 uppercase">Precisión RAG</span>
                                <span className="text-xs font-bold text-indigo-500">94%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[94%]" />
                            </div>
                        </div>
                    </div>
                </ContentCard>

                <ContentCard
                    title="Seguridad Operativa"
                    description="Estado de cumplimiento EN 81-20."
                    icon={<ShieldAlert className="text-rose-500" size={18} />}
                >
                    <div className="flex items-center gap-4 p-2">
                        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-emerald-600 font-bold text-sm">
                            100%
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            No se han detectado desviaciones normativas críticas en los últimos análisis federados.
                        </p>
                    </div>
                </ContentCard>
            </div>
        </div>
    );
}
