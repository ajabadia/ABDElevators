"use client";

import React from 'react';
import { CheckCircle2, AlertCircle, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { ChecklistConfig, ChecklistItem, ChecklistCategory } from '@/lib/schemas';

interface DynamicChecklistProps {
    items: ChecklistItem[];
    config: ChecklistConfig;
    onItemUpdate: (id: string, updates: { status: 'OK' | 'REVIEW' | 'PENDING'; notes?: string }) => void;
    validationStates: Record<string, { status: 'OK' | 'REVIEW' | 'PENDING'; notes?: string }>;
}

export const DynamicChecklist: React.FC<DynamicChecklistProps> = ({
    items,
    config,
    onItemUpdate,
    validationStates
}) => {
    const [expandedCategories, setExpandedCategories] = React.useState<string[]>(
        config.categories.map(c => c.id)
    );

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    // Agrupar ítems por categoría
    const groupedItems = config.categories.reduce((acc, cat) => {
        acc[cat.id] = items.filter(item => item.categoryId === cat.id);
        return acc;
    }, {} as Record<string, ChecklistItem[]>);

    // Ítems sin categoría asignada
    const uncategorizedItems = items.filter(item => !item.categoryId);

    const renderItem = (item: ChecklistItem) => {
        const state = validationStates[item.id] || { status: 'PENDING', notes: '' };

        return (
            <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-slate-300 transition-all mb-3">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-slate-800 font-medium leading-relaxed">
                            {item.description}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-mono">ID: {item.id.substring(0, 8)}</span>
                            {item.notes && (
                                <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 italic">
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    {item.notes}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-start">
                        <button
                            onClick={() => onItemUpdate(item.id, { ...state, status: 'OK' })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${state.status === 'OK'
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-300 hover:text-emerald-500'
                                }`}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            OK
                        </button>
                        <button
                            onClick={() => onItemUpdate(item.id, { ...state, status: 'REVIEW' })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${state.status === 'REVIEW'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                : 'bg-white text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-500'
                                }`}
                        >
                            <AlertCircle className="h-4 w-4" />
                            REVIEW
                        </button>
                    </div>
                </div>

                {/* Notas de validación */}
                <div className="mt-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notas del Técnico</label>
                    </div>
                    <textarea
                        value={state.notes || ''}
                        onChange={(e) => onItemUpdate(item.id, { ...state, notes: e.target.value })}
                        placeholder="Añade observaciones técnicas aquí..."
                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                        rows={1}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {config.categories.map(cat => {
                const categoryItems = groupedItems[cat.id] || [];
                if (categoryItems.length === 0) return null;

                const isExpanded = expandedCategories.includes(cat.id);
                const completedCount = categoryItems.filter(i => validationStates[i.id]?.status !== 'PENDING').length;

                return (
                    <div key={cat.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
                        <button
                            onClick={() => toggleCategory(cat.id)}
                            className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                />
                                <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">
                                    {cat.name}
                                </h3>
                                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    {completedCount} / {categoryItems.length}
                                </span>
                            </div>
                            {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                        </button>

                        {isExpanded && (
                            <div className="p-4">
                                {categoryItems.map(renderItem)}
                            </div>
                        )}
                    </div>
                );
            })}

            {uncategorizedItems.length > 0 && (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
                    <button
                        onClick={() => toggleCategory('uncategorized')}
                        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-slate-300" />
                            <h3 className="font-bold text-slate-600 uppercase tracking-wide text-sm">
                                Otros Hallazgos
                            </h3>
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {uncategorizedItems.length}
                            </span>
                        </div>
                        {expandedCategories.includes('uncategorized') ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </button>

                    {expandedCategories.includes('uncategorized') && (
                        <div className="p-4">
                            {uncategorizedItems.map(renderItem)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
