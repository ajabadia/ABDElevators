"use client";

import React, { useState } from 'react';
import { ChecklistConfig, ChecklistCategory } from '@/lib/schemas';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableCategoryItem } from './SortableCategoryItem';
import { CategoryForm } from './CategoryForm';
import { Plus, GripVertical, Settings2, Eye } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ChecklistEditorProps {
    config: ChecklistConfig;
    onUpdate: (config: ChecklistConfig) => void;
}

export const ChecklistEditor: React.FC<ChecklistEditorProps> = ({ config, onUpdate }) => {
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [view, setView] = useState<'editor' | 'preview'>('editor');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = config.categories.findIndex((c) => c.id === active.id);
            const newIndex = config.categories.findIndex((c) => c.id === over.id);

            const newCategories = arrayMove(config.categories, oldIndex, newIndex);
            onUpdate({
                ...config,
                categories: newCategories,
                workflowOrder: newCategories.map(c => c.id)
            });
        }
    };

    const addCategory = () => {
        const newId = uuidv4();
        const newCategory: ChecklistCategory = {
            id: newId,
            name: 'Nueva Categoría',
            color: '#14b8a6', // Teal default
            keywords: [],
            priority: config.categories.length + 1
        };

        const newCategories = [...config.categories, newCategory];
        onUpdate({
            ...config,
            categories: newCategories,
            workflowOrder: newCategories.map(c => c.id)
        });
        setEditingCategoryId(newId);
    };

    const updateCategory = (updated: ChecklistCategory) => {
        const newCategories = config.categories.map(c => c.id === updated.id ? updated : c);
        onUpdate({
            ...config,
            categories: newCategories
        });
    };

    const deleteCategory = (id: string) => {
        const newCategories = config.categories.filter(c => c.id !== id);
        onUpdate({
            ...config,
            categories: newCategories,
            workflowOrder: newCategories.map(c => c.id)
        });
        if (editingCategoryId === id) setEditingCategoryId(null);
    };

    const editingCategory = config.categories.find(c => c.id === editingCategoryId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Settings2 size={18} className="text-teal-600" />
                            General
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Configuración</label>
                            <input
                                type="text"
                                value={config.name}
                                onChange={(e) => onUpdate({ ...config, name: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ej: Estándar Ascensores Residenciales"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-sm font-medium text-slate-700">Estado Activo</span>
                            <button
                                onClick={() => onUpdate({ ...config, isActive: !config.isActive })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.isActive ? 'bg-teal-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            Categorías
                        </h3>
                        <button
                            onClick={addCategory}
                            className="p-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="p-2 max-h-[500px] overflow-y-auto">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToVerticalAxis]}
                        >
                            <SortableContext
                                items={config.categories.map(c => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-1">
                                    {config.categories.map((category) => (
                                        <SortableCategoryItem
                                            key={category.id}
                                            category={category}
                                            isActive={editingCategoryId === category.id}
                                            onSelect={() => setEditingCategoryId(category.id)}
                                        />
                                    ))}
                                    {config.categories.length === 0 && (
                                        <div className="py-10 px-4 text-center text-slate-400 text-sm italic">
                                            Sin categorías. Pulsa + para añadir.
                                        </div>
                                    )}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8">
                {editingCategory ? (
                    <CategoryForm
                        category={editingCategory}
                        onSave={updateCategory}
                        onDelete={() => deleteCategory(editingCategory.id)}
                    />
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                            <Plus size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">Selecciona una categoría</h3>
                        <p className="text-slate-500 max-w-sm">
                            Elige una categoría de la lista de la izquierda para editar sus reglas o crea una nueva para empezar.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
