"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Layout, Trash2 } from 'lucide-react';
import { ChecklistCategory } from '@/lib/schemas';

interface SortableCategoryProps {
    category: ChecklistCategory;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
}

export function SortableCategory({ category, isActive, onClick, onDelete }: SortableCategoryProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            role="button"
            onClick={onClick}
            className={`
                group relative flex items-center gap-3 p-3 rounded-xl transition-all border
                ${isActive
                    ? 'bg-teal-500/10 border-teal-500/50 text-teal-700 dark:text-teal-100 shadow-md'
                    : 'bg-card/50 border-border text-muted-foreground hover:bg-accent hover:border-border'
                }
            `}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground/30 group-hover:text-muted-foreground transition-colors"
            >
                <GripVertical size={16} />
            </div>

            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
                <Layout size={16} />
            </div>

            <span className="flex-1 text-sm font-bold truncate">
                {category.name}
            </span>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all"
            >
                <Trash2 size={14} />
            </button>

            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-full" />
            )}
        </div>
    );
}
