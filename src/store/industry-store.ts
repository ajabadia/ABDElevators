import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { IndustryType } from '@/lib/schemas';

interface IndustryState {
    industry: IndustryType;
    setIndustry: (industry: IndustryType) => void;
}

/**
 * Robust Cookie-based storage logic with Encoding
 */
const cookieStorage = {
    getItem: (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const rawValue = parts.pop()?.split(';').shift() || null;
            return rawValue ? decodeURIComponent(rawValue) : null;
        }
        return null;
    },
    setItem: (name: string, value: string): void => {
        if (typeof document === 'undefined') return;
        const encodedValue = encodeURIComponent(value);
        document.cookie = `${name}=${encodedValue}; path=/; max-age=31536000; SameSite=Lax`;
    },
    removeItem: (name: string): void => {
        if (typeof document === 'undefined') return;
        document.cookie = `${name}=; path=/; max-age=0`;
    },
};

export const useIndustryStore = create<IndustryState>()(
    persist(
        (set) => ({
            industry: 'ELEVATORS',
            setIndustry: (industry: IndustryType) => set({ industry }),
        }),
        {
            name: 'abd-industry-context',
            storage: createJSONStorage(() => cookieStorage),
        }
    )
);
