"use client";

import React, { useState, useEffect } from 'react';
import { BrandingContext, BrandingData } from '@/context/BrandingContext';

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const [branding, setBranding] = useState<BrandingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        async function fetchBranding() {
            try {
                const response = await fetch('/api/tenant/branding');
                const data = await response.json();

                if (data.success) {
                    setBranding(data.branding);
                    applyBrandingColors(data.branding);
                } else {
                    setError(data.message || 'Error loading branding');
                }
            } catch (err) {
                console.error('Error fetching branding:', err);
                setError('Failed to fetch branding');
            } finally {
                setIsLoading(false);
            }
        }

        fetchBranding();
    }, []);

    const applyBrandingColors = (data: BrandingData) => {
        if (!data.colors) return;

        const root = document.documentElement;

        // Colores principales
        if (data.colors.primary) {
            root.style.setProperty('--tenant-primary', data.colors.primary);
            // También inyectamos una versión oklch si quisiéramos ser pro, 
            // pero por ahora usemos variables CSS estándar que Tailwind pueda leer.
        }

        if (data.colors.accent) {
            root.style.setProperty('--tenant-accent', data.colors.accent);
        }

        if (data.colors.primaryDark) {
            root.style.setProperty('--tenant-primary-dark', data.colors.primaryDark);
        }

        // Favicon dinámico (Fase 18)
        if (data.favicon?.url) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = data.favicon.url;
        }

        // Título de la pestaña
        if (data.companyName) {
            // Opcional: Podríamos forzar el título aquí, aunque Next Metadata es preferible.
        }
    };

    return (
        <BrandingContext.Provider value={{ branding, isLoading, error }}>
            {children}
            {mounted && branding && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                    :root {
                        --tenant-primary: ${branding.colors?.primary || '#0d9488'};
                        --tenant-accent: ${branding.colors?.accent || '#14b8a6'};
                    }
                    .dark {
                        --tenant-primary: ${branding.colors?.primaryDark || branding.colors?.primary || '#5eead4'};
                        --tenant-accent: ${branding.colors?.accentDark || branding.colors?.accent || '#2dd4bf'};
                    }
                    
                    /* Overrides */
                    .text-teal-600 { color: var(--tenant-primary) !important; }
                    .bg-teal-600 { background-color: var(--tenant-primary) !important; }
                    .border-teal-600 { border-color: var(--tenant-primary) !important; }
                    .text-teal-400 { color: var(--tenant-accent) !important; }
                    .bg-teal-400 { background-color: var(--tenant-accent) !important; }
                `}} />
            )}
        </BrandingContext.Provider>
    );
}
