"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, CheckCircle2, MessageSquare } from 'lucide-react';
import { ChecklistItem } from '@/lib/schemas';
import { Input } from '@/components/ui/input';

interface SortableItemProps {
    item: ChecklistItem;
    onUpdate: (updates: Partial<ChecklistItem>) => void;
    onDelete: () => void;
}

export function SortableItem({ item, onUpdate, onDelete }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-4 hover:border-slate-700 transition-all shadow-lg hover:shadow-2xl"
        >
            <div
                {...attributes}
                {...listeners}
                className="mt-2 cursor-grab active:cursor-grabbing text-slate-700 group-hover:text-slate-500 transition-colors"
            >
                <GripVertical size={18} />
            </div>

            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-teal-500 shrink-0" size={18} />
                    <Input
                        value={item.description}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                        className="bg-transparent border-none p-0 h-auto font-medium focus-visible:ring-0 text-slate-200 placeholder:text-slate-600"
                        placeholder="Descripción del punto de validación..."
                    />
                </div>

                <div className="flex items-center gap-2 pl-7 text-xs text-slate-500 italic">
                    <MessageSquare size={12} />
                    <Input
                        value={item.notes || ''}
                        onChange={(e) => onUpdate({ notes: e.target.value })}
                        className="bg-transparent border-none p-0 h-auto text-xs italic focus-visible:ring-0 text-slate-500 placeholder:text-slate-700"
                        placeholder="Notas de ayuda para el técnico (opcional)..."
                    />
                </div>
            </div>

            <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-900/20 hover:text-red-500 rounded-lg transition-all self-center"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}
