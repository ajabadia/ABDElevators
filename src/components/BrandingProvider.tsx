"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { TenantService } from "@/lib/tenant-service";

interface BrandingProviderProps {
    children: React.ReactNode;
}

/**
 * Utility to lighten/darken a color for dark mode optimization
 */
function adjustColor(hex: string, percent: number) {
    const num = parseInt(hex.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

/**
 * BrandingProvider injects CSS variables to customize the UI based on tenant branding settings.
 * Client component to react to session updates (tenant switching).
 */
export default function BrandingProvider({ children }: BrandingProviderProps) {
    const { data: session } = useSession();
    const tenantId = session?.user?.tenantId;
    const [styles, setStyles] = useState("");

    useEffect(() => {
        if (!tenantId) {
            setStyles("");
            return;
        }

        const fetchBranding = async () => {
            try {
                const res = await fetch(`/api/admin/tenants/${tenantId}`);
                const data = await res.json();

                if (data.success && data.config?.branding) {
                    const { colors, autoDarkMode, favicon } = data.config.branding;

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

                    if (!colors) return;

                    // Lógica de optimización:
                    // Si autoDarkMode es true, calculamos. Si es false, usamos los del cliente (fallback al original si no hay específicos).
                    const primaryDark = autoDarkMode !== false
                        ? (colors.primary ? adjustColor(colors.primary, 20) : null)
                        : (colors.primaryDark || colors.primary);

                    const accentDark = autoDarkMode !== false
                        ? (colors.accent ? adjustColor(colors.accent, 15) : null)
                        : (colors.accentDark || colors.accent);

                    const css = `
                        :root {
                            ${colors.primary ? `--primary: ${colors.primary};` : ""}
                            ${colors.secondary ? `--secondary: ${colors.secondary};` : ""}
                            ${colors.accent ? `--accent: ${colors.accent};` : ""}
                        }
                        .dark {
                            ${primaryDark ? `--primary: ${primaryDark};` : ""}
                            ${colors.secondary ? `--secondary: ${colors.secondary};` : ""}
                            ${accentDark ? `--accent: ${accentDark};` : ""}
                        }
                    `;
                    setStyles(css);
                } else {
                    setStyles("");
                }
            } catch (error) {
                console.error("Error fetching branding:", error);
                setStyles("");
            }
        };

        fetchBranding();
    }, [tenantId]);

    return (
        <>
            {styles && <style dangerouslySetInnerHTML={{ __html: styles }} />}
            {children}
        </>
    );
}
