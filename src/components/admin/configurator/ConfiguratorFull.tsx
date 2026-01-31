"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft, Save, Plus, Trash2, Layout, Settings,
    Eye, Monitor, Play, Layers, Sparkles, Loader2,
    CheckCircle2, AlertCircle
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { ChecklistConfig, ChecklistCategory, ChecklistItem } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { SortableCategory } from './SortableCategory';
import { SortableItem } from './SortableItem';
import { PreviewModal } from './PreviewModal';

interface ConfiguratorFullProps {
    initialConfig?: ChecklistConfig;
    isNew?: boolean;
}

export function ConfiguratorFull({ initialConfig, isNew = false }: ConfiguratorFullProps) {
    const [config, setConfig] = useState<ChecklistConfig>(initialConfig || {
        _id: '',
        tenantId: '',
        name: 'Nueva Configuración',
        categories: [],
        items: [],
        workflowOrder: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Sensores para DND
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (config.categories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(config.categories[0].id);
        }
    }, [config.categories, selectedCategoryId]);

    // Handlers para Categorías
    const addCategory = () => {
        const newId = crypto.randomUUID();
        const newCategory: ChecklistCategory = {
            id: newId,
            name: 'Nueva Categoría',
            color: '#0D9488', // Teal-600
            keywords: [],
            priority: config.categories.length + 1,
            icon: 'Layout'
        };

        setConfig(prev => ({
            ...prev,
            categories: [...prev.categories, newCategory],
            workflowOrder: [...prev.workflowOrder, newId]
        }));
        setSelectedCategoryId(newId);
    };

    const deleteCategory = (id: string) => {
        setConfig(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c.id !== id),
            items: prev.items.filter(i => i.categoryId !== id),
            workflowOrder: prev.workflowOrder.filter(oid => oid !== id)
        }));
        if (selectedCategoryId === id) setSelectedCategoryId(null);
    };

    const updateCategory = (id: string, updates: Partial<ChecklistCategory>) => {
        setConfig(prev => ({
            ...prev,
            categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
    };

    // Handlers para Items
    const addItem = () => {
        if (!selectedCategoryId) return;
        const newItem: ChecklistItem = {
            id: crypto.randomUUID(),
            description: 'Nuevo punto de validación',
            categoryId: selectedCategoryId,
            notes: '',
            icon: 'CheckCircle2'
        };
        setConfig(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
    };

    const updateItem = (id: string, updates: Partial<ChecklistItem>) => {
        setConfig(prev => ({
            ...prev,
            items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i)
        }));
    };

    const deleteItem = (id: string) => {
        setConfig(prev => ({
            ...prev,
            items: prev.items.filter(i => i.id !== id)
        }));
    };

    // Drag & Drop Handlers
    const handleDragEndCategories = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setConfig((prev) => {
                const oldIndex = prev.workflowOrder.indexOf(active.id);
                const newIndex = prev.workflowOrder.indexOf(over.id);
                const newOrder = arrayMove(prev.workflowOrder, oldIndex, newIndex);

                // También reordenamos el array de categorías para consistencia visual
                const sortedCats = [...prev.categories].sort((a, b) =>
                    newOrder.indexOf(a.id) - newOrder.indexOf(b.id)
                );

                return {
                    ...prev,
                    workflowOrder: newOrder,
                    categories: sortedCats.map((c, idx) => ({ ...c, priority: idx + 1 }))
                };
            });
        }
    };

    const handleDragEndItems = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setConfig((prev) => {
                const categoryItems = prev.items.filter(i => i.categoryId === selectedCategoryId);
                const otherItems = prev.items.filter(i => i.categoryId !== selectedCategoryId);

                const oldIndex = categoryItems.findIndex(i => i.id === active.id);
                const newIndex = categoryItems.findIndex(i => i.id === over.id);

                const movedItems = arrayMove(categoryItems, oldIndex, newIndex);

                return {
                    ...prev,
                    items: [...otherItems, ...movedItems]
                };
            });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const isEdit = !!config._id && config._id !== '';
            const url = isEdit
                ? `/api/admin/configs-checklist/${config._id}`
                : '/api/admin/configs-checklist';

            const res = await fetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (!res.ok) throw new Error('Fallo al guardar');

            toast({
                title: 'Configuración Guardada',
                description: 'Los cambios se han persistido correctamente.',
                variant: 'default'
            });

            if (isNew) {
                const data = await res.json();
                router.push(`/admin/configs-checklist/${data.config_id}`);
            }
        } catch (error) {
            toast({
                title: 'Error al Guardar',
                description: 'No se pudo guardar la configuración.',
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const currentCategory = config.categories.find(c => c.id === selectedCategoryId);
    const currentItems = config.items.filter(i => i.categoryId === selectedCategoryId);

    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col z-50 overflow-hidden font-sans text-slate-200">
            {/* Header Pro */}
            <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/configs-checklist')}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="h-6 w-px bg-slate-800 mx-2" />
                    <div className="flex flex-col">
                        <Input
                            value={config.name}
                            onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                            className="h-8 bg-transparent border-none text-lg font-bold p-0 focus-visible:ring-0 text-white w-64"
                            placeholder="Nombre de la configuración"
                        />
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                            Configurador Visual de Checklists
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700 mr-4">
                        <button
                            onClick={() => setActiveTab('editor')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'editor' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Monitor size={14} /> Editor
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'preview' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Eye size={14} /> Vista Previa
                        </button>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 shadow-xl shadow-teal-900/20 gap-2 h-10"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Guardando...' : 'Publicar Cambios'}
                    </Button>
                </div>
            </header>

            {/* Main Layout */}
            <main className="flex-1 flex overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === 'editor' ? (
                        <motion.div
                            key="editor"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex-1 flex w-full h-full"
                        >
                            {/* Left Sidebar: Categories */}
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
                                        onDragEnd={handleDragEndCategories}
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

                            {/* Center Board: Items Editor */}
                            <section className="flex-1 bg-slate-950 p-8 overflow-y-auto">
                                <AnimatePresence mode="wait">
                                    {selectedCategoryId ? (
                                        <motion.div
                                            key={selectedCategoryId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="max-w-4xl mx-auto space-y-6"
                                        >
                                            {/* Category Context */}
                                            <div className="flex items-start justify-between bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                                                            style={{ backgroundColor: `${currentCategory?.color}20`, color: currentCategory?.color, border: `1px solid ${currentCategory?.color}40` }}
                                                        >
                                                            <Layout size={20} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <Input
                                                                value={currentCategory?.name}
                                                                onChange={(e) => updateCategory(selectedCategoryId, { name: e.target.value })}
                                                                className="h-10 text-xl font-bold bg-transparent border-none p-0 focus-visible:ring-0 text-white"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">
                                                                Color Identificador
                                                            </label>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={currentCategory?.color}
                                                                    onChange={(e) => updateCategory(selectedCategoryId, { color: e.target.value })}
                                                                    className="w-10 h-10 rounded-lg cursor-pointer bg-slate-800 border-none"
                                                                />
                                                                <code className="text-xs font-mono bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
                                                                    {currentCategory?.color}
                                                                </code>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest pl-1">
                                                                Palabras Clave (Auto-detección)
                                                            </label>
                                                            <Input
                                                                placeholder="Separa por comas (ej: motor, tracción, polea)"
                                                                value={currentCategory?.keywords.join(', ')}
                                                                onChange={(e) => updateCategory(selectedCategoryId, {
                                                                    keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                                                                })}
                                                                className="bg-slate-800/50 border-slate-700 h-10 text-sm transition-all focus:border-teal-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => deleteCategory(selectedCategoryId)}
                                                    className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            {/* Items Sortable List */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-2">
                                                    <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                                        <CheckCircle2 size={14} /> Puntos de Validación ({currentItems.length})
                                                    </h4>
                                                    <Button
                                                        onClick={addItem}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 border-slate-700 hover:bg-teal-900/30 hover:text-teal-400 border-dashed"
                                                    >
                                                        <Plus size={14} className="mr-2" /> Añadir Item
                                                    </Button>
                                                </div>

                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDragEndItems}
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
                                                                    onUpdate={(updates: Partial<ChecklistItem>) => updateItem(item.id, updates)}
                                                                    onDelete={() => deleteItem(item.id)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>

                                                {currentItems.length === 0 && (
                                                    <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                                                        <AlertCircle className="mx-auto text-slate-700 mb-3" size={32} />
                                                        <p className="text-slate-500 text-sm">No hay items en esta categoría.</p>
                                                        <Button
                                                            variant="link"
                                                            onClick={addItem}
                                                            className="text-teal-500 font-bold"
                                                        >
                                                            Añadir el primero
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 shadow-2xl">
                                                <Settings className="text-slate-700 animate-spin-slow" size={40} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-200">Editor de Reglas</h2>
                                                <p className="text-slate-500 max-w-xs mt-2">
                                                    Selecciona una categoría del panel izquierdo para empezar a configurar los puntos de validación.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </section>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="flex-1 bg-slate-900 p-12 overflow-y-auto pattern-grid-slate-800"
                        >
                            <PreviewModal config={config} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <style jsx global>{`
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .pattern-grid-slate-800 {
                    background-image: radial-gradient(circle, #334155 1px, transparent 1px);
                    background-size: 24px 24px;
                }
            `}</style>
        </div>
    );
}
