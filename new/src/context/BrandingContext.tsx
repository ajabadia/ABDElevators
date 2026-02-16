"use client";

import { createContext, useContext } from 'react';

export interface BrandingData {
    companyName?: string;
    logo?: {
        url?: string;
        publicId?: string;
    };
    favicon?: {
        url?: string;
        publicId?: string;
    };
    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        primaryDark?: string;
        accentDark?: string;
    };
    autoDarkMode: boolean;
}

interface BrandingContextType {
    branding: BrandingData | null;
    isLoading: boolean;
    error: string | null;
}

export const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function useBranding() {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
}
