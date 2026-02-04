"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { OnboardingOverlay } from "@/components/ui/onboarding-overlay";

interface OnboardingContextType {
    // We can expose methods from useOnboarding here if needed
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
    return (
        <OnboardingContext.Provider value={{}}>
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
