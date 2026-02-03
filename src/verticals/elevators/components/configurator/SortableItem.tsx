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
            className="group bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:border-border transition-all shadow-lg hover:shadow-2xl"
        >
            <div
                {...attributes}
                {...listeners}
                className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground/30 group-hover:text-muted-foreground transition-colors"
            >
                <GripVertical size={18} />
            </div>

            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-teal-500 shrink-0" size={18} />
                    <Input
                        value={item.description}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                        className="bg-transparent border-none p-0 h-auto font-medium focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50"
                        placeholder="Descripción del punto de validación..."
                    />
                </div>

                <div className="flex items-center gap-2 pl-7 text-xs text-muted-foreground italic">
                    <MessageSquare size={12} />
                    <Input
                        value={item.notes || ''}
                        onChange={(e) => onUpdate({ notes: e.target.value })}
                        className="bg-transparent border-none p-0 h-auto text-xs italic focus-visible:ring-0 text-muted-foreground placeholder:text-muted-foreground/30"
                        placeholder="Notas de ayuda para el técnico (opcional)..."
                    />
                </div>
            </div>

            <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all self-center"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}
