"use client";

import React, { useState } from 'react';
import { ChecklistCategory } from '@/lib/schemas';
import { Tag, Trash2, Hash, HashIcon } from 'lucide-react';

interface CategoryFormProps {
    category: ChecklistCategory;
    onSave: (updated: ChecklistCategory) => void;
    onDelete: () => void;
}

export function CategoryForm({ category, onSave, onDelete }: CategoryFormProps) {
    const [tagInput, setTagInput] = useState('');

    const addTag = () => {
        if (!tagInput.trim()) return;
        if (category.keywords.includes(tagInput.trim().toLowerCase())) {
            setTagInput('');
            return;
        }
        onSave({
            ...category,
            keywords: [...category.keywords, tagInput.trim().toLowerCase()]
        });
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        onSave({
            ...category,
            keywords: category.keywords.filter(t => t !== tag)
        });
    };

    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#10b981', '#14b8a6',
        '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'
    ];

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">Configurar Categoría</h3>
                <button
                    onClick={onDelete}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Eliminar Categoría"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre</label>
                        <input
                            type="text"
                            value={category.nombre}
                            onChange={(e) => onSave({ ...category, nombre: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Color de Etiqueta</label>
                        <div className="flex flex-wrap gap-3">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => onSave({ ...category, color })}
                                    className={`w-8 h-8 rounded-full border-2 transition-all transform hover:scale-110 shadow-sm
                                        ${category.color === color ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent'}
                                    `}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Prioridad</label>
                        <input
                            type="number"
                            value={category.prioridad}
                            onChange={(e) => onSave({ ...category, prioridad: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold px-1">Menor número = mayor prioridad</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6">
                <label className="block text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Tag size={18} className="text-teal-600" />
                    Palabras Clave (Keywords)
                </label>

                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <HashIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                            placeholder="Añadir palabra clave técnico..."
                        />
                    </div>
                    <button
                        onClick={addTag}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold shadow-sm"
                    >
                        Añadir
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {category.keywords.map(tag => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:border-teal-200 transition-colors group"
                        >
                            {tag}
                            <button
                                onClick={() => removeTag(tag)}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </span>
                    ))}
                    {category.keywords.length === 0 && (
                        <p className="text-sm text-slate-400 italic py-2">
                            Aún no hay palabras clave. Defínelas para que la IA asigne automáticamente elementos a esta categoría.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
