import { create } from "zustand";
import { TenantConfig, TenantUsageStats } from "@/lib/schemas";

interface TenantConfigState {
    config: TenantConfig | null;
    usageStats: TenantUsageStats | null;
    isLoading: boolean;
    isSaving: boolean;
    isFetched: boolean;
    error: string | null;
    setConfig: (config: TenantConfig | null) => void;
    setUsageStats: (stats: TenantUsageStats | null) => void;
    setIsLoading: (loading: boolean) => void;
    setIsSaving: (saving: boolean) => void;
    setError: (error: string | null) => void;
    updateConfig: (updates: Partial<TenantConfig>) => void;
    hydrate: (config: TenantConfig | null, stats?: TenantUsageStats | null) => void;
}

export const useTenantConfigStore = create<TenantConfigState>((set) => ({
    config: null,
    usageStats: null,
    isLoading: false,
    isSaving: false,
    isFetched: false,
    error: null,
    setConfig: (config) => set({ config, isFetched: true, error: null }),
    setUsageStats: (stats) => set({ usageStats: stats }),
    setIsLoading: (loading) => set({ isLoading: loading }),
    setIsSaving: (saving) => set({ isSaving: saving }),
    setError: (error) => set({ error, isFetched: true }),
    updateConfig: (updates) => set((state) => ({
        config: state.config ? { ...state.config, ...updates } : null
    })),
    hydrate: (config, stats) => set({
        config,
        usageStats: stats || null,
        isFetched: true,
        error: null,
        isLoading: false
    })
}));
