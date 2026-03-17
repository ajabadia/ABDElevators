import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type OnboardingStep = 'identity' | 'team' | 'documents' | 'complete';

interface OnboardingState {
    currentStep: OnboardingStep;
    data: {
        name?: string;
        industry?: string;
        logoUrl?: string;
        brandColors?: {
            primary: string;
            secondary: string;
        };
        teamInvites: string[];
    };
    isCompleted: boolean;
    
    // Actions
    setStep: (step: OnboardingStep) => void;
    updateData: (data: Partial<OnboardingState['data']>) => void;
    addTeamInvite: (email: string) => void;
    removeTeamInvite: (email: string) => void;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
}

/**
 * Cookie-based storage implementation for Next.js consistency (Rule #5)
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

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            currentStep: 'identity',
            data: {
                teamInvites: [],
            },
            isCompleted: false,

            setStep: (currentStep) => set({ currentStep }),
            
            updateData: (newData) => set((state) => ({ 
                data: { ...state.data, ...newData } 
            })),

            addTeamInvite: (email) => set((state) => ({
                data: { ...state.data, teamInvites: [...state.data.teamInvites, email] }
            })),

            removeTeamInvite: (email) => set((state) => ({
                data: { ...state.data, teamInvites: state.data.teamInvites.filter(e => e !== email) }
            })),

            completeOnboarding: () => set({ isCompleted: true, currentStep: 'complete' }),

            resetOnboarding: () => set({
                currentStep: 'identity',
                data: { teamInvites: [] },
                isCompleted: false
            }),
        }),
        {
            name: 'onboarding-progress',
            storage: createJSONStorage(() => cookieStorage),
        }
    )
);
