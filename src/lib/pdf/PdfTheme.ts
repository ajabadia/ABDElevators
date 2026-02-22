
import { BrandingManager } from '../branding/BrandingManager';

/**
 * PdfTheme - Centralized styling and localization for PDF documents.
 * Rule #10: Accessibility (WCAG Color Contrast) & Premium Design.
 */
export class PdfTheme {
    static readonly MARGINS = {
        TOP: 20,
        BOTTOM: 25,
        LEFT: 15,
        RIGHT: 15
    };

    static readonly FONTS = {
        TITLE: 22,
        SUBTITLE: 14,
        SECTION: 16,
        BODY: 10,
        SMALL: 8,
        TINY: 7
    };

    /**
     * Resolves theme colors and locale settings.
     */
    static getTheme(locale: string = 'es', industry: string = 'GENERIC') {
        const palette = BrandingManager.getIndustryPalette(industry);

        return {
            colors: {
                primary: palette.primary,     // e.g., Teal-600
                secondary: palette.secondary, // e.g., Slate-900
                muted: '#64748b',            // Slate-500
                danger: '#dc2626',           // Red-600
                background: '#f8fafc'        // Slate-50
            },
            locale,
            dateFormat: locale === 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
            dateTimeFormat: locale === 'en' ? 'MM/DD/YYYY HH:mm' : 'DD/MM/YYYY HH:mm'
        };
    }

    /**
     * Formatting helper for consistent dates across PDFs.
     */
    static formatDate(date: Date, locale: string = 'es'): string {
        return new Intl.DateTimeFormat(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }

    /**
     * Formatting helper for consistent currency.
     */
    static formatCurrency(amount: number, locale: string = 'es', currency: string = 'EUR'): string {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency
        }).format(amount);
    }
}
