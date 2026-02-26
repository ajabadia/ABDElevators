"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { OnboardingOverlay } from "@/components/ui/onboarding-overlay";
import { useOnboarding } from "@/hooks/useOnboarding";
import { WorkContext } from "@/lib/work-context";

interface OnboardingContextType {
    currentStep: number;
    userContext?: WorkContext;
    isCompleted: boolean;
    isVisible: boolean;
    progress: number;
    setUserContext: (context: WorkContext) => Promise<void>;
    nextStep: () => Promise<void>;
    prevStep: () => Promise<void>;
    skipOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const onboarding = useOnboarding();

    return (
        <OnboardingContext.Provider value={{
            currentStep: onboarding.currentStepIndex,
            userContext: onboarding.userContext,
            isCompleted: onboarding.isCompleted,
            isVisible: onboarding.isVisible,
            progress: onboarding.progress,
            setUserContext: onboarding.setUserContext,
            nextStep: onboarding.nextStep,
            prevStep: onboarding.prevStep,
            skipOnboarding: onboarding.skipOnboarding
        }}>
            {children}
            <OnboardingOverlay />
        </OnboardingContext.Provider>
    );
}

export function useOnboardingContext() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error("useOnboardingContext must be used within an OnboardingProvider");
    }
    return context;
}
