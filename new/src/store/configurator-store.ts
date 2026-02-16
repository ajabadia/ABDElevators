import { create } from 'zustand';
import { ChecklistConfig, ChecklistCategory, ChecklistItem } from '@/lib/types';
import { arrayMove } from '@dnd-kit/sortable';

interface ConfiguratorState {
    config: ChecklistConfig;
    selectedCategoryId: string | null;
    activeTab: 'editor' | 'preview';
    isSaving: boolean;

    // Core Actions
    init: (initialConfig: ChecklistConfig) => void;
    setConfigName: (name: string) => void;
    setSelectedCategoryId: (id: string | null) => void;
    setActiveTab: (tab: 'editor' | 'preview') => void;
    setIsSaving: (isSaving: boolean) => void;

    // Category Handlers
    addCategory: () => void;
    deleteCategory: (id: string) => void;
    updateCategory: (id: string, updates: Partial<ChecklistCategory>) => void;
    reorderCategories: (activeId: string, overId: string) => void;

    // Item Handlers
    addItem: () => void;
    updateItem: (id: string, updates: Partial<ChecklistItem>) => void;
    deleteItem: (id: string) => void;
    reorderItems: (activeId: string, overId: string) => void;

    // Selectors
    getCurrentCategory: () => ChecklistCategory | undefined;
    getCurrentItems: () => ChecklistItem[];
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
    config: {
        _id: '',
        tenantId: '',
        name: 'Nueva Configuración',
        categories: [],
        items: [],
        workflowOrder: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    selectedCategoryId: null,
    activeTab: 'editor',
    isSaving: false,

    init: (initialConfig) => {
        set({
            config: initialConfig,
            selectedCategoryId: initialConfig.categories.length > 0 ? initialConfig.categories[0].id : null
        });
    },

    setConfigName: (name) => set((state) => ({
        config: { ...state.config, name }
    })),

    setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

    setActiveTab: (tab) => set({ activeTab: tab }),

    setIsSaving: (isSaving) => set({ isSaving }),

    addCategory: () => {
        const newId = crypto.randomUUID();
        const { config } = get();
        const newCategory: ChecklistCategory = {
            id: newId,
            name: 'Nueva Categoría',
            color: '#0D9488',
            keywords: [],
            priority: config.categories.length + 1,
            icon: 'Layout'
        };

        set((state) => ({
            config: {
                ...state.config,
                categories: [...state.config.categories, newCategory],
                workflowOrder: [...state.config.workflowOrder, newId]
            },
            selectedCategoryId: newId
        }));
    },

    deleteCategory: (id) => set((state) => {
        const newSelectedId = state.selectedCategoryId === id ? null : state.selectedCategoryId;
        return {
            config: {
                ...state.config,
                categories: state.config.categories.filter(c => c.id !== id),
                items: state.config.items.filter(i => i.categoryId !== id),
                workflowOrder: state.config.workflowOrder.filter(oid => oid !== id)
            },
            selectedCategoryId: newSelectedId
        };
    }),

    updateCategory: (id, updates) => set((state) => ({
        config: {
            ...state.config,
            categories: state.config.categories.map(c => c.id === id ? { ...c, ...updates } : c)
        }
    })),

    reorderCategories: (activeId, overId) => set((state) => {
        const oldIndex = state.config.workflowOrder.indexOf(activeId);
        const newIndex = state.config.workflowOrder.indexOf(overId);
        const newOrder = arrayMove(state.config.workflowOrder, oldIndex, newIndex);

        const sortedCats = [...state.config.categories].sort((a, b) =>
            newOrder.indexOf(a.id) - newOrder.indexOf(b.id)
        );

        return {
            config: {
                ...state.config,
                workflowOrder: newOrder,
                categories: sortedCats.map((c, idx) => ({ ...c, priority: idx + 1 }))
            }
        };
    }),

    addItem: () => {
        const { selectedCategoryId } = get();
        if (!selectedCategoryId) return;

        const newItem: ChecklistItem = {
            id: crypto.randomUUID(),
            description: 'Nuevo punto de validación',
            categoryId: selectedCategoryId,
            notes: '',
            icon: 'CheckCircle2'
        };

        set((state) => ({
            config: {
                ...state.config,
                items: [...state.config.items, newItem]
            }
        }));
    },

    updateItem: (id, updates) => set((state) => ({
        config: {
            ...state.config,
            items: state.config.items.map(i => i.id === id ? { ...i, ...updates } : i)
        }
    })),

    deleteItem: (id) => set((state) => ({
        config: {
            ...state.config,
            items: state.config.items.filter(i => i.id !== id)
        }
    })),

    reorderItems: (activeId, overId) => set((state) => {
        const { selectedCategoryId } = state;
        const categoryItems = state.config.items.filter(i => i.categoryId === selectedCategoryId);
        const otherItems = state.config.items.filter(i => i.categoryId !== selectedCategoryId);

        const oldIndex = categoryItems.findIndex(i => i.id === activeId);
        const newIndex = categoryItems.findIndex(i => i.id === overId);

        const movedItems = arrayMove(categoryItems, oldIndex, newIndex);

        return {
            config: {
                ...state.config,
                items: [...otherItems, ...movedItems]
            }
        };
    }),

    getCurrentCategory: () => {
        const { config, selectedCategoryId } = get();
        return config.categories.find(c => c.id === selectedCategoryId);
    },

    getCurrentItems: () => {
        const { config, selectedCategoryId } = get();
        return config.items.filter(i => i.categoryId === selectedCategoryId);
    }
}));
