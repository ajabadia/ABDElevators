
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PdfLayout } from './PdfLayout';
import { PdfTheme } from './PdfTheme';
import { ItemValidation, ChecklistConfig, Entity } from '@/lib/schemas';

// --- Interfaces ---

export interface DetectedModel {
    type: string;
    model: string;
    ragContext?: Array<{
        text: string;
        source: string;
        score: number;
    }>;
}

export interface ReportData {
    identifier: string;
    analysisDate: Date;
    models: DetectedModel[];
    correlationId: string;
    locale?: string;
}

export interface AuditReportData {
    entity: Entity;
    config: ChecklistConfig;
    items: ItemValidation[];
    userName: string;
    durationMs: number;
    timestamp: Date;
    correlationId: string;
    tenantId: string;
}

export interface AuditLog {
    _id: string;
    level: string;
    source: string;
    action: string;
    message: string;
    userEmail?: string;
    performedBy?: string;
    timestamp: string | Date;
    correlationId?: string;
}

// --- Generators ---

/**
 * 📄 ClientReportGenerator (ERA 8 Consolidated)
 * Unified engine for generating PDFs in the browser.
 */
export class ClientReportGenerator {

    /**
     * Generates a technical report for RAG analysis results.
     */
    static async generateRAGReport(data: ReportData): Promise<Blob> {
        const doc = new jsPDF('p', 'mm', 'a4');
        const locale = data.locale || 'es';
        const theme = PdfTheme.getTheme(locale);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        PdfLayout.attachDocumentMetadata(doc, {
            tenantId: data.identifier,
            correlationId: data.correlationId
        });

        let currentY = PdfLayout.drawStandardHeader(doc, {
            title: 'ABD RAG Platform',
            subtitle: locale === 'es' ? 'Informe Técnico RAG' : 'Technical RAG Report',
            correlationId: data.correlationId,
            locale
        });

        currentY += 15;

        // Entity Header
        doc.setTextColor(theme.colors.secondary);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Entity: ${data.identifier}`, PdfTheme.MARGINS.LEFT, currentY);

        currentY += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${locale === 'es' ? 'Fecha de análisis' : 'Analysis Date'}: ${PdfTheme.formatDate(data.analysisDate, locale)}`, PdfTheme.MARGINS.LEFT, currentY);

        currentY += 15;
        currentY = PdfLayout.drawSectionTitle(doc, locale === 'es' ? 'Componentes Detectados' : 'Detected Components', currentY, locale);

        data.models.forEach((model, idx) => {
            currentY = PdfLayout.ensurePageSpace(doc, currentY, 40);

            // Model Header
            doc.setFillColor(theme.colors.background);
            doc.rect(PdfTheme.MARGINS.LEFT, currentY - 5, pageWidth - (PdfTheme.MARGINS.LEFT * 2), 10, 'F');
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(theme.colors.primary);
            doc.text(`${idx + 1}. ${model.type}: ${model.model}`, PdfTheme.MARGINS.LEFT + 3, currentY + 2);
            currentY += 12;

            if (model.ragContext?.length) {
                // ... Context rendering ...
                model.ragContext.forEach(ctx => {
                    currentY = PdfLayout.ensurePageSpace(doc, currentY, 20);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    doc.setTextColor(theme.colors.secondary);
                    const lines = doc.splitTextToSize(ctx.text, pageWidth - (PdfTheme.MARGINS.LEFT * 3));
                    doc.text(lines, PdfTheme.MARGINS.LEFT + 5, currentY);
                    currentY += (lines.length * 4) + 6;
                });
            }
            currentY += 5;
        });

        PdfLayout.drawStandardFooter(doc, data.correlationId, locale);
        return doc.output('blob');
    }

    /**
     * Generates a validation audit trail (Checklist/Guardian view).
     */
    static async generateValidationAudit(data: AuditReportData, locale: string = 'es'): Promise<Blob> {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const theme = PdfTheme.getTheme(locale);
        const pageWidth = pdf.internal.pageSize.getWidth();

        PdfLayout.attachDocumentMetadata(pdf, {
            tenantId: data.tenantId,
            correlationId: data.correlationId,
            generatedBy: data.userName
        });

        const t = locale === 'es' ? {
            title: "INFORME DE TRAZABILIDAD TÉCNICA",
            resultsTitle: "Puntos de Control Verificados"
        } : {
            title: "TECHNICAL AUDIT TRAIL REPORT",
            resultsTitle: "Verified Control Points"
        };

        let y = PdfLayout.drawStandardHeader(pdf, {
            title: t.title,
            subtitle: `Validación: ${data.entity.identifier}`,
            correlationId: data.correlationId,
            locale
        });

        y = PdfLayout.drawSectionTitle(pdf, t.resultsTitle, y, locale);

        data.items.forEach((item, index) => {
            y = PdfLayout.ensurePageSpace(pdf, y, 25);
            pdf.setFillColor(theme.colors.background);
            pdf.rect(PdfTheme.MARGINS.LEFT, y - 5, pageWidth - (PdfTheme.MARGINS.LEFT * 2), 22, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${index + 1}. [${item.status}] ${item.itemId}`, PdfTheme.MARGINS.LEFT + 3, y);
            y += 15;
        });

        PdfLayout.drawStandardFooter(pdf, data.correlationId, locale);
        return pdf.output('blob');
    }

    /**
     * Downloads any blob with a specified filename.
     */
    static download(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}
