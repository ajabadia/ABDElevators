import { jsPDF } from 'jspdf';
import { logEvento } from '@/lib/logger';
import { TranslationService } from '@/lib/translation-service';

interface LLMReportPDFData {
    identifier: string;
    client: string;
    content: string; // Markdown
    tenantId: string;
    date: Date;
    technician: string;
    locale?: string;
    branding?: {
        logo?: { url?: string };
        colors?: {
            primary?: string;
            accent?: string;
        };
    };
    reportConfig?: {
        disclaimer?: string;
        signatureText?: string;
        footerText?: string;
        primaryColor?: string;
        includeSources?: boolean;
    };
}

/**
 * Generates a PDF on the server from the content of an LLM report.
 * Designed to run in Node.js environments (Vercel).
 */
export async function generateServerPDF(data: LLMReportPDFData): Promise<Buffer> {
    const start = Date.now();
    const locale = data.locale || 'es';

    // Corporate style tokens (Fallback to platform defaults)
    // Priority: Report-specific Color > Branding Primary Color > Default Teal
    const brandColor = data.reportConfig?.primaryColor || data.branding?.colors?.primary || '#0d9488';
    const accentColor = data.branding?.colors?.accent || brandColor;
    const logoUrl = data.branding?.logo?.url;

    // Fetch dynamic translations (Phase 96 - Dynamic i18n Reports)
    const messages = await TranslationService.getMessages(locale, data.tenantId);
    const t = messages.common?.reports || {
        title: "Análisis Técnico Avanzado",
        subtitle: "Documento de Evaluación Técnica Asistida",
        details: "Detalles del Informe",
        technician: "Técnico Responsable",
        date: "Fecha de Generación",
        client: "Cliente",
        page: "Página {current} de {total}",
        automaticFootnote: "Informe generado automáticamente por el Motor de Inteligencia ABD"
    };

    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 20;

    // Header
    const rgbPrimary = brandColor.startsWith('#') ? hexToRgb(brandColor) : { r: 13, g: 148, b: 136 };
    doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo if available
    if (logoUrl) {
        try {
            // Nota: En un entorno real de servidor, jsPDF necesita la imagen en base64 o fetch
            // Por simplicidad en este MVP asumimos que el logoUrl es accesible o dejamos placeholder
            // doc.addImage(logoUrl, 'PNG', margin, 5, 15, 15);
        } catch (e) {
            console.error("Error adding logo to PDF", e);
        }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(t.title.toUpperCase(), margin, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(t.subtitle.toUpperCase(), margin, 25);
    doc.text(`Tenant ID: ${data.tenantId} | Entity: ${data.identifier}`, margin, 32);

    y = 55;

    // Info Section
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(t.details, margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const accentRgb = accentColor.startsWith('#') ? hexToRgb(accentColor) : { r: 13, g: 148, b: 136 };
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.text(`${t.client}: ${data.client}`, margin, y);
    doc.setTextColor(51, 65, 85);
    y += 5;

    const formattedDate = data.date.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`${t.date}: ${formattedDate}`, margin, y);
    y += 5;
    doc.text(`${t.technician}: ${data.technician}`, margin, y);
    y += 15;

    // Content (Simplified Markdown)
    doc.setTextColor(0, 0, 0);
    const lines = data.content.split('\n');

    for (const line of lines) {
        if (y > pageHeight - 30) { // Mayor margen para el footer dinámico
            doc.addPage();
            y = 20;
        }

        if (line.startsWith('# ')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
            doc.text(line.substring(2), margin, y);
            y += 10;
        } else if (line.startsWith('## ')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
            doc.text(line.substring(3), margin, y);
            y += 8;
        } else if (line.startsWith('### ')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
            doc.text(line.substring(4), margin, y);
            y += 6;
        } else if (line.trim() === '') {
            y += 4;
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);

            const cleanLine = line.replace(/\*\*/g, '');
            const wrappedText = doc.splitTextToSize(cleanLine, contentWidth);

            if (y + (wrappedText.length * 5) > pageHeight - 30) {
                doc.addPage();
                y = 20;
            }

            doc.text(wrappedText, margin, y);
            y += (wrappedText.length * 5) + 2;
        }
    }

    // Disclaimer & Signature (Phase 64)
    if (y > pageHeight - 50) {
        doc.addPage();
        y = 25;
    }

    y += 10;
    if (data.reportConfig?.signatureText) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(data.reportConfig.signatureText, margin, y);
        y += 5;
        doc.line(margin, y, margin + 60, y);
        y += 15;
    }

    if (data.reportConfig?.disclaimer) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        const wrappedDisclaimer = doc.splitTextToSize(data.reportConfig.disclaimer, contentWidth);
        doc.text(wrappedDisclaimer, margin, y);
    }

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400

        const pageLabel = t.page
            .replace('{current}', i.toString())
            .replace('{total}', totalPages.toString());

        const footerNote = data.reportConfig?.footerText || t.automaticFootnote;
        doc.text(
            `${pageLabel} | ${footerNote}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    const duration = Date.now() - start;
    await logEvento({
        level: 'DEBUG',
        source: 'SERVER_PDF_UTILS',
        action: 'GENERATE_PDF',
        message: `PDF generated on server for ${data.identifier} (Locale: ${locale})`,
        correlationId: 'pdf-gen-' + Date.now(),
        details: { durationMs: duration, pages: totalPages, branded: !!data.branding }
    });

    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
}

/**
 * Helper to convert hex to RGB
 */
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 13, g: 148, b: 136 };
}
