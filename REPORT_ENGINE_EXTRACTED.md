                correlationId,
                tenantId,
                details: { key, ttL2: ttlL2, resultCount: results.length }
            });
        } catch (error) {
            console.warn("[CACHE SET ERROR]", error);
        }
    }

    /**
     * Limpia la caché local (L1). Útil en deploys o cambios masivos.
     */
    static clearL1(): void {
        this.l1.clear();
    }
}

================================================================================
FILE: .\src\lib\server-pdf-utils.ts
================================================================================
import { jsPDF } from 'jspdf';
import { logEvento } from '@/lib/logger';
import { ReportTemplate, ReportData } from './schemas/report-template';

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
 * Legacy wrapper for backward compatibility.
 */
export async function generateServerPDF(data: LLMReportPDFData): Promise<Buffer> {
    return renderMarkdownToPDF(data);
}

/**
 * ReportEngine: Generates a PDF based on a structured Template.
 */
export async function generateTemplatedReport(
    template: ReportTemplate,
    data: ReportData,
    options: { locale?: string } = {}
): Promise<Buffer> {
    const start = Date.now();
    const locale = options.locale || 'es';

    // Branding resolution
    const brandColor = data.branding?.colors?.primary || template.defaultConfig?.primaryColor || '#0d9488';
    const accentColor = data.branding?.colors?.accent || brandColor;
    // const logoUrl = data.branding?.logo?.url;

    const doc = new jsPDF({
        orientation: template.defaultConfig?.orientation || 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 20;

    // --- Header ---
    const rgbPrimary = hexToRgb(brandColor);
    doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(data.title.toUpperCase(), margin, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (data.subtitle) doc.text(data.subtitle.toUpperCase(), margin, 25);

    const metaText = `Tenant: ${data.tenantId} | Date: ${data.date.toLocaleDateString(locale)}`;
    doc.text(metaText, margin, 32);

    y = 55;

    // --- Sections Rendering ---
    for (const section of template.sections) {
        // Page Break Logic
        if (section.layout?.breakPageBefore && y > 60) {
            doc.addPage();
            y = 20;
        } else if (y > pageHeight - 40) {
            doc.addPage();
            y = 20;
        }

        // Section Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        const rgbAccent = hexToRgb(accentColor);
        doc.setTextColor(rgbAccent.r, rgbAccent.g, rgbAccent.b);
        doc.text(section.title, margin, y);
        y += 8;

        if (section.description) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(section.description, margin, y);
            y += 8;
        }

        // Section Content by Type
        const sectionData = section.dataSource ? data.data[section.dataSource] : null;

        if (section.type === 'TEXT') {
            if (typeof sectionData === 'string') {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                const splitText = doc.splitTextToSize(sectionData, contentWidth);

                if (y + (splitText.length * 5) > pageHeight - 20) {
                    doc.addPage();
                    y = 20;
                }

                doc.text(splitText, margin, y);
                y += (splitText.length * 5) + 10;
            }
        } else if (section.type === 'METRICS_GRID') {
            if (Array.isArray(sectionData)) {
                const cols = section.layout?.columns || 2;
                const colWidth = contentWidth / cols;
                let maxHeightInRow = 0;

                sectionData.forEach((metric: any, index: number) => {
                    const colIndex = index % cols;
                    const x = margin + (colIndex * colWidth);

                    if (colIndex === 0 && index > 0) {
                        y += maxHeightInRow + 10;
                        maxHeightInRow = 0;
                        if (y > pageHeight - 30) {
                            doc.addPage();
                            y = 20;
                        }
                    }

                    // Metric Box
                    doc.setFillColor(248, 250, 252); // Slate-50
                    doc.setDrawColor(226, 232, 240); // Slate-200
                    doc.roundedRect(x, y, colWidth - 5, 20, 2, 2, 'FD');

                    doc.setFontSize(8);
                    doc.setTextColor(100, 116, 139);
                    doc.text(metric.label?.toUpperCase() || '', x + 4, y + 6);

                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(30, 41, 59);
                    doc.text(String(metric.value || '-'), x + 4, y + 14);

                    maxHeightInRow = 20;
                });
                y += maxHeightInRow + 15;
            }
        } else if (section.type === 'DATA_TABLE') {
            if (Array.isArray(sectionData) && sectionData.length > 0) {
                // Simple manual table rendering
                const headers = Object.keys(sectionData[0]);
                const colWidth = contentWidth / headers.length;

                // Header Row
                doc.setFillColor(241, 245, 249);
                doc.rect(margin, y, contentWidth, 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(71, 85, 105);

                headers.forEach((header, i) => {
                    doc.text(header.toUpperCase(), margin + (i * colWidth) + 2, y + 5);
                });
                y += 8;

                // Data Rows
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(51, 65, 85);

                sectionData.forEach((row: any, i) => {
                    if (y > pageHeight - 20) {
                        doc.addPage();
                        y = 20;
                    }

                    if (i % 2 === 0) {
                        doc.setFillColor(255, 255, 255);
                    } else {
                        doc.setFillColor(248, 250, 252);
                        doc.rect(margin, y - 5, contentWidth, 8, 'F');
                    }

                    headers.forEach((header, colIndex) => {
                        const cellText = String(row[header] || '').substring(0, 30); // Truncate
                        doc.text(cellText, margin + (colIndex * colWidth) + 2, y);
                    });
                    y += 6;
                });
                y += 10;
            }
        }
    }

    // --- Footer & Disclaimer ---
    if (template.defaultConfig?.includeSources) { // Reusing flag for Footer logic
        // ... Similar footer logic ...
    }

    const duration = Date.now() - start;
    await logEvento({
        level: 'INFO',
        source: 'REPORT_ENGINE',
        action: 'GENERATE_TEMPLATED_PDF',
        message: `Generated report ${template.name}`,
        correlationId: `rep-${Date.now()}`,
        details: { duration, sections: template.sections.length }
    });

    return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Internal Worker: Generates PDF from Markdown (Logic moved from original function)
 */
async function renderMarkdownToPDF(data: LLMReportPDFData): Promise<Buffer> {
    const start = Date.now();
    const locale = data.locale || 'es';

    // Corporate style tokens (Fallback to platform defaults)
    const brandColor = data.reportConfig?.primaryColor || data.branding?.colors?.primary || '#0d9488';
    const accentColor = data.branding?.colors?.accent || brandColor;
    const logoUrl = data.branding?.logo?.url;

    // Use existing locale variable from top of function
    // Removed server-side TranslationService usage for client compatibility

    // Default messages if not provided (Phase 160.1 Fix)
    const t = {
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
            // Placeholder for logo logic
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

    // Disclaimer & Signature
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

================================================================================
FILE: .\src\lib\session-service.ts
================================================================================
export * from "@abd/platform-core/session-service";

================================================================================
FILE: .\src\lib\simple-queue.ts
================================================================================
import { logEvento } from './logger';

/**
 * Simple in-memory queue for ingestion jobs
 * Replaces BullMQ for simplicity and reliability
 */

export interface IngestionJob {
    docId: string;
    data: any;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    addedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
}

class SimpleIngestionQueue {
    private queue: Map<string, IngestionJob> = new Map();

    /**
     * Add a new job to the queue
     */
    add(docId: string, data: any): void {
        this.queue.set(docId, {
            docId,
            data,
            status: 'PENDING',
            addedAt: new Date(),
        });

