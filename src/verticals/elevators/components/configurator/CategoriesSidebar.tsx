"use client";

import React from 'react';
import { Layers, Plus, Sparkles } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useConfiguratorStore } from '@/store/configurator-store';
import { SortableCategory } from './SortableCategory';

export function CategoriesSidebar() {
    const {
        config,
        selectedCategoryId,
        setSelectedCategoryId,
        addCategory,
        deleteCategory,
        reorderCategories
    } = useConfiguratorStore();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            reorderCategories(active.id, over.id);
        }
    };

    return (
        <aside className="w-80 border-r border-slate-800 bg-slate-900/30 flex flex-col shrink-0">
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Layers size={14} /> Categorías
                </h3>
                <button
                    onClick={addCategory}
                    className="p-1.5 bg-slate-800 hover:bg-teal-900/40 hover:text-teal-400 rounded-md transition-all border border-slate-700"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={config.workflowOrder}
                        strategy={verticalListSortingStrategy}
                    >
                        {config.workflowOrder.map((id) => {
                            const cat = config.categories.find(c => c.id === id);
                            if (!cat) return null;
                            return (
                                <SortableCategory
                                    key={cat.id}
                                    category={cat}
                                    isActive={selectedCategoryId === cat.id}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    onDelete={() => deleteCategory(cat.id)}
                                />
                            );
                        })}
                    </SortableContext>
                </DndContext>

                {config.categories.length === 0 && (
                    <div className="py-12 text-center">
                        <div className="inline-flex p-4 rounded-full bg-slate-900 border border-slate-800 mb-4">
                            <Sparkles className="text-slate-700" size={32} />
                        </div>
                        <p className="text-slate-500 text-sm">Empieza añadiendo una categoría</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
