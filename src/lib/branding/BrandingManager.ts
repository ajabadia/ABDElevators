
/**
 * BrandingManager - Centralized control for tenant-specific visual identity.
 * Phase 8: High-Impact Polish
 */
export class BrandingManager {

    /**
     * Generates a CSS variable block for a specific theme.
     */
    static generateThemeCSS(primary: string, secondary: string, radius: string = '0.5rem'): string {
        return `
            :root {
                --brand-primary: ${primary};
                --brand-secondary: ${secondary};
                --brand-radius: ${radius};
                --brand-primary-rgb: ${this.hexToRgb(primary)};
            }
        `.trim();
    }

    /**
     * Maps a tenant industry to a curated color palette.
     */
    static getIndustryPalette(industry: string): { primary: string, secondary: string } {
        const palettes: Record<string, { primary: string, secondary: string }> = {
            'CONSTRUCTION': { primary: '#0f172a', secondary: '#f59e0b' },
            'HEALTHCARE': { primary: '#0d9488', secondary: '#60a5fa' },
            'FINANCE': { primary: '#1e3a8a', secondary: '#94a3b8' },
            'GENERIC': { primary: '#0d9488', secondary: '#0f172a' }
        };

        return palettes[industry.toUpperCase()] || palettes.GENERIC;
    }

    /**
     * Utility to convert HEX to RGB for semi-transparent layers.
     */
    private static hexToRgb(hex: string): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    }

    /**
     * Returns the appropriate favicon path for specific environments.
     */
    static getFavicon(environment: string = 'PRODUCTION'): string {
        return environment === 'DEVELOPMENT' ? '/favicon-dev.ico' : '/favicon.ico';
    }
}
