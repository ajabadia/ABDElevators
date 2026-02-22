import jsPDF from 'jspdf';
import { PdfLayout } from './pdf/PdfLayout';
import { PdfTheme } from './pdf/PdfTheme';

interface DetectedModel {
    type: string;
    model: string;
    ragContext?: Array<{
        text: string;
        source: string;
        score: number;
    }>;
}

interface ReportData {
    identifier: string;
    analysisDate: Date;
    models: DetectedModel[];
    correlationId: string;
    locale?: string;
}

/**
 * Genera un PDF profesional del informe RAG
 * Regla de Oro #8: Medir performance
 */
export async function generatePDFReport(data: ReportData): Promise<Blob> {
    const start = Date.now();
    const locale = data.locale || 'es';

    try {
        const doc = new jsPDF('p', 'mm', 'a4');
        const theme = PdfTheme.getTheme(locale);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        PdfLayout.attachDocumentMetadata(doc, {
            tenantId: data.identifier,
            correlationId: data.correlationId
        });

        // Header unificado
        let currentY = PdfLayout.drawStandardHeader(doc, {
            title: 'ABD RAG Platform',
            subtitle: 'Informe Técnico RAG',
            correlationId: data.correlationId,
            locale
        });

        currentY += 15;

        // Información del pedido
        doc.setTextColor(theme.colors.secondary);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Entity: ${data.identifier}`, PdfTheme.MARGINS.LEFT, currentY);

        currentY += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${locale === 'es' ? 'Fecha de análisis' : 'Analysis Date'}: ${PdfTheme.formatDate(data.analysisDate, locale)}`, PdfTheme.MARGINS.LEFT, currentY);
        doc.text(`${locale === 'es' ? 'ID de correlación' : 'correlation ID'}: ${data.correlationId}`, PdfTheme.MARGINS.LEFT, currentY + 5);

        currentY += 15;

        // Modelos detectados
        currentY = PdfLayout.drawSectionTitle(doc, locale === 'es' ? 'Componentes Detectados' : 'Detected Components', currentY);

        data.models.forEach((model, idx) => {
            // Verificar si necesitamos nueva página
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = 20;
            }

            // Título del modelo
            doc.setFillColor(theme.colors.background);
            doc.rect(PdfTheme.MARGINS.LEFT, currentY - 5, pageWidth - (PdfTheme.MARGINS.LEFT * 2), 10, 'F');

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(theme.colors.primary);
            doc.text(`${idx + 1}. ${model.type}: ${model.model}`, PdfTheme.MARGINS.LEFT + 3, currentY + 2);

            currentY += 12;

            // Contexto RAG
            if (model.ragContext && model.ragContext.length > 0) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(theme.colors.secondary);
                doc.text(locale === 'es' ? 'Documentación Técnica:' : 'Technical Documentation:', PdfTheme.MARGINS.LEFT + 3, currentY);
                currentY += 6;

                model.ragContext.forEach((ctx, ctxIdx) => {
                    if (currentY > pageHeight - 30) {
                        doc.addPage();
                        currentY = 20;
                    }

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(theme.colors.muted);
                    doc.text(`${locale === 'es' ? 'Fuente' : 'Source'}: ${ctx.source} (${locale === 'es' ? 'Relevancia' : 'Score'}: ${(ctx.score * 100).toFixed(0)}%)`, PdfTheme.MARGINS.LEFT + 5, currentY);

                    currentY += 5;

                    // Texto del fragmento (con wrapping)
                    doc.setFontSize(9);
                    doc.setTextColor(theme.colors.secondary);
                    const lines = doc.splitTextToSize(ctx.text, pageWidth - (PdfTheme.MARGINS.LEFT * 3));
                    doc.text(lines, PdfTheme.MARGINS.LEFT + 5, currentY);
                    currentY += lines.length * 4 + 5;
                });
            }

            currentY += 5;
        });

        // Footer unificado
        PdfLayout.drawStandardFooter(doc, data.correlationId, locale);

        const duration = Date.now() - start;
        console.log(`PDF generado en ${duration}ms`);

        return doc.output('blob');
    } catch (error) {
        console.error('Error generando PDF:', error);
        throw new Error('Fallo al generar el informe PDF');
    }
}

/**
 * Descarga el PDF generado
 */
export function downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
