import { create } from 'zustand';

interface EphemeralState {
    dismissedItems: Set<string>;
    dismissItem: (key: string) => void;
    isDismissed: (key: string) => boolean;
    resetEphemeral: () => void;
}

/**
 * 🍃 EphemeralStore
 * Manages client-side only state that doesn't survive page refreshes.
 * Satisfies Rule #5 (No Browser Storage) by using React/Zustand state instead of sessionStorage.
 */
export const useEphemeralStore = create<EphemeralState>((set, get) => ({
    dismissedItems: new Set<string>(),
    
    dismissItem: (key: string) => set((state) => {
        const newSet = new Set(state.dismissedItems);
        newSet.add(key);
        return { dismissedItems: newSet };
    }),
    
    isDismissed: (key: string) => get().dismissedItems.has(key),
    
    resetEphemeral: () => set({ dismissedItems: new Set<string>() }),
}));
