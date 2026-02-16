import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    branding?: {
        logoUrl?: string;
        primaryColor?: string;
        companyName?: string;
        footerText?: string;
        legalDisclaimer?: string;
    };
}

/**
 * Genera un PDF profesional del informe RAG
 * Regla de Oro #8: Medir performance
 */
export async function generatePDFReport(data: ReportData): Promise<Blob> {
    const start = Date.now();

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPosition = 20;

        // Settings de Branding
        const primaryColorHex = data.branding?.primaryColor || '#0d9488'; // Default Teal-600
        // Convert hex to RGB for jsPDF
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 13, g: 148, b: 136 };
        };
        const brandColor = hexToRgb(primaryColorHex);

        // Header con branding
        pdf.setFillColor(brandColor.r, brandColor.g, brandColor.b);
        pdf.rect(0, 0, pageWidth, 30, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text(data.branding?.companyName || 'ABD RAG Plataform', 15, 15);

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Informe Técnico RAG', 15, 23);

        yPosition = 45;

        // Información del pedido
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Entity: ${data.identifier}`, 15, yPosition);

        yPosition += 10;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Fecha de análisis: ${data.analysisDate.toLocaleDateString('es-ES')}`, 15, yPosition);
        pdf.text(`ID de correlación: ${data.correlationId}`, 15, yPosition + 5);

        yPosition += 15;

        // Modelos detectados
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Componentes Detectados', 15, yPosition);
        yPosition += 8;

        data.models.forEach((model, idx) => {
            // Verificar si necesitamos nueva página
            if (yPosition > pageHeight - 40) {
                pdf.addPage();
                yPosition = 20;
            }

            // Título del modelo
            pdf.setFillColor(241, 245, 249); // Slate-100
            pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(brandColor.r, brandColor.g, brandColor.b);
            pdf.text(`${idx + 1}. ${model.type}: ${model.model}`, 18, yPosition);

            yPosition += 12;

            // Contexto RAG
            if (model.ragContext && model.ragContext.length > 0) {
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0, 0, 0);
                pdf.text('Documentación Técnica:', 18, yPosition);
                yPosition += 6;

                model.ragContext.forEach((ctx, ctxIdx) => {
                    if (yPosition > pageHeight - 30) {
                        pdf.addPage();
                        yPosition = 20;
                    }

                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(8);
                    pdf.setTextColor(100, 100, 100);
                    pdf.text(`Fuente: ${ctx.source} (Relevancia: ${(ctx.score * 100).toFixed(0)}%)`, 20, yPosition);

                    yPosition += 5;

                    // Texto del fragmento (con wrapping)
                    pdf.setFontSize(9);
                    pdf.setTextColor(0, 0, 0);
                    const lines = pdf.splitTextToSize(ctx.text, pageWidth - 45);
                    pdf.text(lines, 20, yPosition);
                    yPosition += lines.length * 4 + 5;
                });
            }

            yPosition += 5;
        });

        // Footer
        const totalPages = pdf.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);

            // Legal Disclaimer (si existe)
            if (data.branding?.legalDisclaimer) {
                pdf.setFontSize(7);
                pdf.setTextColor(100, 100, 100);
                const disclaimerLines = pdf.splitTextToSize(data.branding.legalDisclaimer, pageWidth - 30);
                // Calcular posición Y para disclaimer (justo encima del footer standard)
                const disclaimerY = pageHeight - 15 - (disclaimerLines.length * 3);
                pdf.text(disclaimerLines, 15, disclaimerY);
            }

            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            const footerText = data.branding?.footerText
                ? `${data.branding.footerText} | Página ${i} de ${totalPages}`
                : `Página ${i} de ${totalPages} | Generado por ABD RAG Plataform System`;

            pdf.text(
                footerText,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        const duration = Date.now() - start;
        console.log(`PDF generado en ${duration}ms`);

        return pdf.output('blob');
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
