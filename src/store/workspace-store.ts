import { create } from 'zustand';
import { ChecklistItem } from '@/lib/types';

interface SearchResult {
    answer: string;
    documents: any[];
    trace: string[];
}

interface ValidationStatus {
    status: 'OK' | 'REVIEW' | 'PENDING';
    notes?: string;
}

interface WorkspaceState {
    // Search State
    searchQuery: string;
    isSearching: boolean;
    searchResult: SearchResult | null;
    showTrace: boolean;

    // Checklist State
    checklistExpandedCategories: string[];
    validationStates: Record<string, ValidationStatus>;

    // Actions - Search
    setSearchQuery: (query: string) => void;
    performSearch: () => Promise<void>;
    toggleTrace: () => void;
    resetSearch: () => void;

    // Actions - Checklist
    toggleChecklistCategory: (categoryId: string) => void;
    updateChecklistItem: (itemId: string, updates: Partial<ValidationStatus>) => void;
    setInitialExpandedCategories: (categoryIds: string[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
    // Initial Search State
    searchQuery: '',
    isSearching: false,
    searchResult: null,
    showTrace: false,

    // Initial Checklist State
    checklistExpandedCategories: [],
    validationStates: {},

    // Search Actions
    setSearchQuery: (searchQuery) => set({ searchQuery }),

    performSearch: async () => {
        const { searchQuery } = get();
        if (!searchQuery.trim()) return;

        set({ isSearching: true, searchResult: null, showTrace: false });

        try {
            const res = await fetch('/api/tecnico/rag/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: searchQuery })
            });
            const data = await res.json();
            if (data.success) {
                set({ searchResult: data });
            }
        } catch (err) {
            console.error("Error in agentic search:", err);
        } finally {
            set({ isSearching: false });
        }
    },

    toggleTrace: () => set((state) => ({ showTrace: !state.showTrace })),

    resetSearch: () => set({ searchQuery: '', searchResult: null, isSearching: false, showTrace: false }),

    // Checklist Actions
    toggleChecklistCategory: (categoryId) => set((state) => ({
        checklistExpandedCategories: state.checklistExpandedCategories.includes(categoryId)
            ? state.checklistExpandedCategories.filter(id => id !== categoryId)
            : [...state.checklistExpandedCategories, categoryId]
    })),

    updateChecklistItem: (itemId, updates) => set((state) => ({
        validationStates: {
            ...state.validationStates,
            [itemId]: {
                ...(state.validationStates[itemId] || { status: 'PENDING', notes: '' }),
                ...updates
            }
        }
    })),

    setInitialExpandedCategories: (categoryIds) => set({ checklistExpandedCategories: categoryIds })
}));
