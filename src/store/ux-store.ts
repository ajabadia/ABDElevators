import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UXState {
    expertMode: boolean;
    toggleExpertMode: () => void;
    setExpertMode: (mode: boolean) => void;
}

/**
 * Cookie-based storage for Zustand to comply with project rules (Rule #5).
 * Since we don't have a generic cookie util yet, we implement a simple one.
 */
const cookieStorage = {
    getItem: (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
    },
    setItem: (name: string, value: string): void => {
        if (typeof document === 'undefined') return;
        document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
    },
    removeItem: (name: string): void => {
        if (typeof document === 'undefined') return;
        document.cookie = `${name}=; path=/; max-age=0`;
    },
};

export const useUXStore = create<UXState>()(
    persist(
        (set) => ({
            expertMode: false,
            toggleExpertMode: () => set((state) => ({ expertMode: !state.expertMode })),
            setExpertMode: (expertMode) => set({ expertMode }),
        }),
        {
            name: 'ux-expert-mode', // cookie name
            storage: createJSONStorage(() => cookieStorage),
        }
    )
);
