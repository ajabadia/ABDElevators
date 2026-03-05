import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface NavigationState {
    routeHits: Record<string, number>;
    trackHit: (path: string) => void;
    getRouteWeight: (path: string) => number;
}

/**
 * Cookie-based storage logic (Rule #5 compliance)
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

export const useNavigationStore = create<NavigationState>()(
    persist(
        (set, get) => ({
            routeHits: {},
            trackHit: (path) => {
                const hits = { ...get().routeHits };
                hits[path] = (hits[path] || 0) + 1;
                set({ routeHits: hits });
            },
            getRouteWeight: (path) => {
                return get().routeHits[path] || 0;
            }
        }),
        {
            name: 'abd-nav-frequency',
            storage: createJSONStorage(() => cookieStorage),
        }
    )
);
