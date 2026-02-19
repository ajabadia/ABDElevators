"use client";

import React from 'react';
import { Layout, Trash2, CheckCircle2, Plus, AlertCircle, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useConfiguratorStore } from '@/store/configurator-store';
import { SortableItem } from './SortableItem';

export function CategoryEditor() {
    const t = useTranslations('admin.configurator.editor');
    const {
        selectedCategoryId,
        updateCategory,
        deleteCategory,
        getCurrentCategory,
        getCurrentItems,
        addItem,
        updateItem,
        deleteItem,
        reorderItems
    } = useConfiguratorStore();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const currentCategory = getCurrentCategory();
    const currentItems = getCurrentItems();

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            reorderItems(active.id, over.id);
        }
    };

    if (!selectedCategoryId || !currentCategory) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 transition-colors duration-300">
                <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center border border-border shadow-2xl">
                    <Settings className="text-muted-foreground/30 animate-spin-slow" size={40} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>
                    <p className="text-muted-foreground max-w-xs mt-2">
                        {t('subtitle')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={selectedCategoryId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-6"
            >
                {/* Category Context */}
                <div className="flex items-start justify-between bg-card/50 p-6 rounded-2xl border border-border shadow-2xl backdrop-blur-xl transition-colors duration-300">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: `${currentCategory.color}20`, color: currentCategory.color, border: `1px solid ${currentCategory.color}40` }}
                            >
                                <Layout size={20} />
                            </div>
                            <div className="flex-1">
                                <Input
                                    value={currentCategory.name}
                                    placeholder={t('category_name_placeholder')}
                                    onChange={(e) => updateCategory(selectedCategoryId, { name: e.target.value })}
                                    className="h-10 text-xl font-bold bg-transparent border-none p-0 focus-visible:ring-0 text-foreground"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">
                                    {t('color_label')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={currentCategory.color}
                                        onChange={(e) => updateCategory(selectedCategoryId, { color: e.target.value })}
                                        className="w-10 h-10 rounded-lg cursor-pointer bg-muted border-none"
                                    />
                                    <code className="text-xs font-mono bg-muted px-3 py-2 rounded-lg border border-border">
                                        {currentCategory.color}
                                    </code>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">
                                    {t('keywords_label')}
                                </label>
                                <Input
                                    placeholder={t('keywords_placeholder')}
                                    value={currentCategory.keywords.join(', ')}
                                    onChange={(e) => updateCategory(selectedCategoryId, {
                                        keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                                    })}
                                    className="bg-muted/50 border-border h-10 text-sm transition-all focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => deleteCategory(selectedCategoryId)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                        title={t('delete_category_tooltip')}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* Items Sortable List */}
                <div className="space-y-4 transition-colors duration-300">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 size={14} /> {t('validation_points')} ({currentItems.length})
                        </h4>
                        <Button
                            onClick={addItem}
                            variant="outline"
                            size="sm"
                            className="h-8 border-border hover:bg-primary/10 hover:text-primary border-dashed"
                        >
                            <Plus size={14} className="mr-2" /> {t('add_item_btn')}
                        </Button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={currentItems.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-3">
                                {currentItems.map((item) => (
                                    <SortableItem
                                        key={item.id}
                                        item={item}
                                        onUpdate={(updates) => updateItem(item.id, updates)}
                                        onDelete={() => deleteItem(item.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {currentItems.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
                            <AlertCircle className="mx-auto text-muted-foreground/30" size={32} />
                            <p className="text-muted-foreground text-sm">{t('empty_items')}</p>
                            <Button
                                variant="link"
                                onClick={addItem}
                                className="text-primary font-bold"
                            >
                                {t('add_first_item')}
                            </Button>
                        </div>
                    )}
                </div>

                <style jsx global>{`
                    .animate-spin-slow {
                        animation: spin 8s linear infinite;
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </motion.div>
        </AnimatePresence>
    );
}
