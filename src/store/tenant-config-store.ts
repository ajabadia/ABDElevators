import { create } from "zustand";
import { TenantConfig } from "@/lib/schemas";

interface TenantConfigState {
    config: TenantConfig | null;
    usageStats: any;
    isLoading: boolean;
    isSaving: boolean;
    setConfig: (config: TenantConfig | null) => void;
    setUsageStats: (stats: any) => void;
    setIsLoading: (loading: boolean) => void;
    setIsSaving: (saving: boolean) => void;
    updateConfig: (updates: Partial<TenantConfig>) => void;
}

export const useTenantConfigStore = create<TenantConfigState>((set) => ({
    config: null,
    usageStats: null,
    isLoading: false,
    isSaving: false,
    setConfig: (config) => set({ config }),
    setUsageStats: (stats) => set({ usageStats: stats }),
    setIsLoading: (loading) => set({ isLoading: loading }),
    setIsSaving: (saving) => set({ isSaving: saving }),
    updateConfig: (updates) => set((state) => ({
        config: state.config ? { ...state.config, ...updates } : null
    }))
}));
