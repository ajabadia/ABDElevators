"use client";

import React, { useState } from 'react';
import { ChecklistCategory } from '@/lib/schemas';
import { Tag, Trash2, Hash, HashIcon, Zap, Shield, Wrench, Cpu, Layers, Box, RotateCcw, Activity, AlertTriangle, FileText, LucideIcon, HelpCircle } from 'lucide-react';

interface CategoryFormProps {
    category: ChecklistCategory;
    onSave: (updated: ChecklistCategory) => void;
    onDelete: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
    'Zap': Zap,
    'Shield': Shield,
    'Wrench': Wrench,
    'Cpu': Cpu,
    'Layers': Layers,
    'Box': Box,
    'RotateCcw': RotateCcw,
    'Activity': Activity,
    'AlertTriangle': AlertTriangle,
    'FileText': FileText
};

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

    const icons = Object.keys(ICON_MAP);

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20"
                        style={{ backgroundColor: category.color }}
                    >
                        {category.icono && ICON_MAP[category.icono] ? (
                            React.createElement(ICON_MAP[category.icono], { size: 24 })
                        ) : (
                            <Hash size={24} />
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Configurar Categoría</h3>
                        <p className="text-sm text-slate-500 font-medium">{category.nombre || 'Nueva Categoría'}</p>
                    </div>
                </div>
                <button
                    onClick={onDelete}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Eliminar Categoría"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre de Categoría</label>
                        <input
                            type="text"
                            value={category.nombre}
                            onChange={(e) => onSave({ ...category, nombre: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium"
                            placeholder="Ej: Seguridad Eléctrica"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Icono Identificador</label>
                        <div className="grid grid-cols-5 gap-2">
                            {icons.map(iconName => {
                                const IconComp = ICON_MAP[iconName];
                                return (
                                    <button
                                        key={iconName}
                                        onClick={() => onSave({ ...category, icono: iconName })}
                                        className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center
                                            ${category.icono === iconName
                                                ? 'border-teal-500 bg-teal-50 text-teal-600 scale-105 shadow-sm'
                                                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600'}
                                        `}
                                        title={iconName}
                                    >
                                        <IconComp size={20} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Color de Etiqueta</label>
                        <div className="flex flex-wrap gap-3">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => onSave({ ...category, color })}
                                    className={`w-10 h-10 rounded-xl border-2 transition-all transform hover:scale-110 shadow-sm
                                        ${category.color === color ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent'}
                                    `}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Prioridad en Visualización</label>
                        <input
                            type="number"
                            value={category.prioridad}
                            onChange={(e) => onSave({ ...category, prioridad: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium"
                        />
                        <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold px-1 flex items-center gap-1">
                            <HelpCircle size={10} />
                            Menor número = mayor prioridad (aparece antes)
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-8 shadow-inner">
                <label className="block text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Tag size={20} className="text-teal-600" />
                    Reglas de Clasificación (Keywords)
                </label>

                <p className="text-sm text-slate-500 mb-6">
                    Define términos técnicos que activarán esta categoría automáticamente cuando se detecten en un documento.
                </p>

                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <HashIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all shadow-sm"
                            placeholder="Añadir palabra (ej: freno, contactor, cable...)"
                        />
                    </div>
                    <button
                        onClick={addTag}
                        className="px-8 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-bold shadow-md active:scale-95"
                    >
                        Añadir
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {category.keywords.map(tag => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 pl-4 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:border-teal-300 hover:shadow-md transition-all group"
                        >
                            {tag}
                            <button
                                onClick={() => removeTag(tag)}
                                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </span>
                    ))}
                    {category.keywords.length === 0 && (
                        <div className="w-full py-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-sm text-slate-400 italic font-medium">
                                Aún no hay palabras clave definidas.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
