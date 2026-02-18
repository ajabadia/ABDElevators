"use client";

import React, { useState, useEffect } from 'react';
import { BrandingContext, BrandingData } from '@/context/BrandingContext';
import { useSession } from "next-auth/react";

/**
 * Utility to lighten/darken a color for dark mode optimization
 */
function adjustColor(hex: string, percent: number) {
    if (!hex || !hex.startsWith('#')) return hex;
    try {
        const num = parseInt(hex.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    } catch (e) {
        return hex;
    }
}

/**
 * Utility to determine if a color should have black or white text
 */
function getContrastColor(hexcolor: string) {
    if (!hexcolor || !hexcolor.startsWith('#')) return '#ffffff';
    try {
        const r = parseInt(hexcolor.substring(1, 3), 16);
        const g = parseInt(hexcolor.substring(3, 5), 16);
        const b = parseInt(hexcolor.substring(5, 7), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    } catch (e) {
        return '#ffffff';
    }
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [branding, setBranding] = useState<BrandingData | null>(null);
    const [styles, setStyles] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            setIsLoading(false);
            return;
        }

        async function fetchBranding() {
            try {
                // Ensure fresh data
                const response = await fetch('/api/tenant/branding', { cache: 'no-store' });
                if (response.status === 401) {
                    setIsLoading(false);
                    return;
                }

                const data = await response.json();
                console.log("[BrandingProvider] Fetched data:", data);

                if (data.success && data.branding) {
                    setBranding(data.branding);

                    const { colors, autoDarkMode, favicon } = data.branding;

                    // Update Favicon
                    if (favicon?.url) {
                        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
                        if (!link) {
                            link = document.createElement('link');
                            link.rel = 'icon';
                            document.getElementsByTagName('head')[0].appendChild(link);
                        }
                        link.href = favicon.url;
                    }

                    if (colors) {
                        const primary = colors.primary || '#0f172a';
                        const primaryFg = getContrastColor(primary);
                        const accent = colors.accent || colors.primary || '#3b82f6';
                        const accentFg = getContrastColor(accent);

                        // Optimization logic for dark mode:
                        const primaryDark = autoDarkMode !== false
                            ? (colors.primary ? adjustColor(colors.primary, 20) : '#38bdf8')
                            : (colors.primaryDark || colors.primary || '#38bdf8');

                        const primaryDarkFg = getContrastColor(primaryDark);

                        const accentDark = autoDarkMode !== false
                            ? (colors.accent ? adjustColor(colors.accent, 15) : '#60a5fa')
                            : (colors.accentDark || colors.accent || '#60a5fa');

                        const accentDarkFg = getContrastColor(accentDark);

                        const css = `
                            :root {
                                --primary: ${primary};
                                --primary-foreground: ${primaryFg};
                                --accent: ${accent};
                                --accent-foreground: ${accentFg};
                                --ring: ${primary};
                                --sidebar-primary: ${primary};
                                --sidebar-primary-foreground: ${primaryFg};
                                --tenant-primary: ${primary}; /* Backwards compatibility */
                                ${colors.secondary ? `--secondary: ${colors.secondary};` : ""}
                            }
                            .dark {
                                --primary: ${primaryDark};
                                --primary-foreground: ${primaryDarkFg};
                                --accent: ${accentDark};
                                --accent-foreground: ${accentDarkFg};
                                --ring: ${primaryDark};
                                --sidebar-primary: ${primaryDark};
                                --sidebar-primary-foreground: ${primaryDarkFg};
                                --tenant-primary: ${primaryDark}; /* Backwards compatibility */
                            }
                            /* Force theme across common Tailwind classes */
                            .text-primary { color: var(--primary) !important; }
                            .bg-primary { background-color: var(--primary) !important; }
                            .border-primary { border-color: var(--primary) !important; }
                            
                            /* Legacy teal overrides (force consistency) */
                            .text-teal-600 { color: var(--primary) !important; }
                            .text-teal-400 { color: var(--primary) !important; }
                            .bg-teal-600 { background-color: var(--primary) !important; }
                            .bg-teal-500 { background-color: var(--primary) !important; }
                            .bg-teal-400 { background-color: var(--primary) !important; }
                            .border-teal-600 { border-color: var(--primary) !important; }
                            .hover\\:bg-teal-700:hover { background-color: var(--primary) !important; filter: brightness(0.9); }
                            .shadow-teal-600\\/20 { --tw-shadow-color: var(--primary); }
                        `;
                        setStyles(css);
                    }
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
    }, [status]);

    return (
        <BrandingContext.Provider value={{ branding, isLoading, error }}>
            {children}
            {mounted && styles && <style dangerouslySetInnerHTML={{ __html: styles }} />}
        </BrandingContext.Provider>
    );
}
