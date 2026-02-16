"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChecklistCategory } from '@/lib/schemas';
import { GripVertical, ChevronRight } from 'lucide-react';

interface SortableCategoryItemProps {
    category: ChecklistCategory;
    isActive: boolean;
    onSelect: () => void;
}

export function SortableCategoryItem({ category, isActive, onSelect }: SortableCategoryItemProps) {
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
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border
                ${isDragging ? 'opacity-50 scale-105 shadow-xl bg-white border-teal-200' : ''}
                ${isActive
                    ? 'bg-teal-50 border-teal-100 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-slate-50'
                }
            `}
            onClick={onSelect}
        >
            <div
                {...attributes}
                {...listeners}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical size={18} />
            </div>

            <div
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: category.color }}
            />

            <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${isActive ? 'text-teal-900' : 'text-slate-700'}`}>
                    {category.name}
                </div>
                <div className="text-[10px] text-slate-400 font-medium tracking-tight">
                    {category.keywords.length} PALABRAS CLAVE
                </div>
            </div>

            <ChevronRight
                size={16}
                className={`transition-transform duration-300 ${isActive ? 'translate-x-1 text-teal-600' : 'text-slate-300'}`}
            />
        </div>
    );
}
