
import { jsPDF } from 'jspdf';
import { PdfTheme } from './PdfTheme';

interface HeaderOptions {
    title: string;
    subtitle?: string;
    correlationId?: string;
    locale?: string;
    industry?: string;
}

/**
 * PdfLayout - Reusable blocks for building "Serious" PDFs.
 * Phase 8.1 Orchestration.
 */
export class PdfLayout {

    /**
     * Draws a premium header with branding.
     */
    static drawStandardHeader(doc: jsPDF, options: HeaderOptions) {
        const theme = PdfTheme.getTheme(options.locale, options.industry);
        const pageWidth = doc.internal.pageSize.getWidth();

        // Background Header Bar
        doc.setFillColor(theme.colors.primary);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Main Title
        doc.setTextColor('#ffffff');
        doc.setFontSize(PdfTheme.FONTS.TITLE);
        doc.setFont('helvetica', 'bold');
        doc.text(options.title.toUpperCase(), PdfTheme.MARGINS.LEFT, 25);

        // Subtitle if exists
        if (options.subtitle) {
            doc.setFontSize(PdfTheme.FONTS.SUBTITLE);
            doc.setFont('helvetica', 'normal');
            doc.text(options.subtitle, PdfTheme.MARGINS.LEFT, 33);
        }

        // Correlation ID (Tracing) in top right
        if (options.correlationId) {
            doc.setFontSize(PdfTheme.FONTS.TINY);
            doc.setTextColor('#ffffff');
            doc.text(`ID: ${options.correlationId}`, pageWidth - PdfTheme.MARGINS.RIGHT, 10, { align: 'right' });
        }

        // Platform Brand
        doc.setFontSize(PdfTheme.FONTS.SMALL);
        doc.text('ABD RAG PLATFORM', pageWidth - PdfTheme.MARGINS.RIGHT, 25, { align: 'right' });

        return 45; // Returns next Y position
    }

    /**
     * Draws a standardized footer.
     */
    static drawStandardFooter(doc: jsPDF, correlationId?: string, locale: string = 'es') {
        const pageCount = (doc.internal as any).getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const theme = PdfTheme.getTheme(locale);

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(PdfTheme.FONTS.SMALL);
            doc.setTextColor(theme.colors.muted);

            // Legal / Info
            const dateStr = PdfTheme.formatDate(new Date(), locale);
            doc.text(
                `Generado electrónicamente el ${dateStr} | ABD RAG Platform`,
                PdfTheme.MARGINS.LEFT,
                pageHeight - 10
            );

            // Page Number
            doc.text(
                `Página ${i} de ${pageCount}`,
                pageWidth - PdfTheme.MARGINS.RIGHT,
                pageHeight - 10,
                { align: 'right' }
            );

            // Secondary Trace
            if (correlationId) {
                doc.setFontSize(PdfTheme.FONTS.TINY);
                doc.text(
                    `Trace: ${correlationId}`,
                    pageWidth / 2,
                    pageHeight - 5,
                    { align: 'center' }
                );
            }
        }
    }

    /**
     * Standardized Section Title.
     */
    static drawSectionTitle(doc: jsPDF, text: string, y: number, locale: string = 'es') {
        const theme = PdfTheme.getTheme(locale);

        doc.setFontSize(PdfTheme.FONTS.SECTION);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(theme.colors.primary);
        doc.text(text, PdfTheme.MARGINS.LEFT, y);

        // Underline
        doc.setDrawColor(theme.colors.primary);
        doc.setLineWidth(0.5);
        doc.line(PdfTheme.MARGINS.LEFT, y + 2, 60, y + 2);

        return y + 10;
    }

    /**
     * Helper to ensure there's enough vertical space on the current page.
     */
    static ensurePageSpace(doc: jsPDF, y: number, requiredHeight: number): number {
        const pageHeight = doc.internal.pageSize.getHeight();
        if (y + requiredHeight > pageHeight - PdfTheme.MARGINS.BOTTOM) {
            doc.addPage();
            return PdfTheme.MARGINS.TOP;
        }
        return y;
    }

    /**
     * Attaches platform-standard metadata to the document.
     */
    static attachDocumentMetadata(doc: jsPDF, options: {
        tenantId: string,
        correlationId: string,
        generatedBy?: string
    }) {
        doc.setProperties({
            title: 'Documento ABD RAG Platform',
            subject: `Tenant: ${options.tenantId}`,
            author: options.generatedBy || 'ABD System',
            keywords: `rag, elevator, ${options.tenantId}`,
            creator: 'ABD RAG Platform'
        });
    }
}
