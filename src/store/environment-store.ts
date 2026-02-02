import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppEnvironment } from '@/lib/schemas';

interface EnvironmentState {
    environment: AppEnvironment;
    setEnvironment: (env: AppEnvironment) => void;
}

export const useEnvironmentStore = create<EnvironmentState>()(
    persist(
        (set) => ({
            environment: 'PRODUCTION',
            setEnvironment: (environment: AppEnvironment) => set({ environment }),
        }),
        {
            name: 'abd-environment-storage',
        }
    )
);
