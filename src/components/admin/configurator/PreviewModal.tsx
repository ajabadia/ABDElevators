"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ChecklistConfig } from '@/lib/schemas';
import {
    CheckCircle2, AlertTriangle, HelpCircle,
    ArrowRight, Info, Smartphone
} from 'lucide-react';

interface PreviewModalProps {
    config: ChecklistConfig;
}

export function PreviewModal({ config }: PreviewModalProps) {
    return (
        <div className="max-w-md mx-auto">
            {/* Simulator Frame */}
            <div className="bg-slate-950 rounded-[3rem] border-[8px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative">
                {/* iPhone Notch Style */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />

                {/* Content */}
                <div className="bg-slate-50 h-[700px] overflow-y-auto pt-10 pb-8 px-6 text-slate-900">
                    <header className="mb-8">
                        <div className="flex items-center gap-2 text-teal-600 font-black text-xs uppercase tracking-widest mb-2">
                            <Smartphone size={12} /> Live Preview
                        </div>
                        <h2 className="text-2xl font-black leading-tight">
                            {config.nombre}
                        </h2>
                        <p className="text-slate-500 text-xs mt-1">
                            Simulación de la vista móvil del técnico.
                        </p>
                    </header>

                    <div className="space-y-8">
                        {config.workflow_orden.map((catId, idx) => {
                            const cat = config.categorias.find(c => c.id === catId);
                            const items = config.items.filter(i => i.categoryId === catId);
                            if (!cat) return null;

                            return (
                                <motion.section
                                    key={cat.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="space-y-4"
                                >
                                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: cat.color }}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                        {cat.nombre}
                                    </h3>

                                    <div className="space-y-3">
                                        {items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 hover:shadow-md transition-shadow cursor-pointer"
                                            >
                                                <div className="mt-1 w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold leading-snug">
                                                        {item.description}
                                                    </p>
                                                    {item.notes && (
                                                        <div className="mt-2 flex items-start gap-1.5 text-[10px] text-slate-400 font-medium italic">
                                                            <Info size={10} className="mt-0.5 shrink-0" />
                                                            {item.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {items.length === 0 && (
                                            <div className="py-4 px-6 rounded-2xl bg-slate-100/50 border border-dashed border-slate-200 text-center">
                                                <p className="text-[10px] text-slate-400">Sin items configurados</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.section>
                            );
                        })}

                        {config.categorias.length === 0 && (
                            <div className="py-20 text-center">
                                <HelpCircle className="mx-auto text-slate-200 mb-2" size={40} />
                                <p className="text-slate-400 text-sm italic">Configura alguna categoría para ver la previsualización.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-12">
                        <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                            Finalizar Inspección <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Hint */}
            <div className="mt-6 flex items-center justify-center gap-4 text-slate-500">
                <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Válido
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    <AlertTriangle size={12} className="text-amber-500" /> Riesgo
                </div>
            </div>
        </div>
    );
}
