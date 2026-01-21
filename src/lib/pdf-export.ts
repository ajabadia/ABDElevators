import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ModeloDetectado {
    tipo: string;
    modelo: string;
    contexto_rag?: Array<{
        texto: string;
        source: string;
        score: number;
    }>;
}

interface ReportData {
    numeroPedido: string;
    fechaAnalisis: Date;
    modelos: ModeloDetectado[];
    correlacionId: string;
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

        // Header con branding
        pdf.setFillColor(13, 148, 136); // Teal-600
        pdf.rect(0, 0, pageWidth, 30, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ABDElevators', 15, 15);

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Informe Técnico RAG', 15, 23);

        yPosition = 45;

        // Información del pedido
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Pedido: ${data.numeroPedido}`, 15, yPosition);

        yPosition += 10;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Fecha de análisis: ${data.fechaAnalisis.toLocaleDateString('es-ES')}`, 15, yPosition);
        pdf.text(`ID de correlación: ${data.correlacionId}`, 15, yPosition + 5);

        yPosition += 15;

        // Modelos detectados
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Componentes Detectados', 15, yPosition);
        yPosition += 8;

        data.modelos.forEach((modelo, idx) => {
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
            pdf.setTextColor(13, 148, 136);
            pdf.text(`${idx + 1}. ${modelo.tipo}: ${modelo.modelo}`, 18, yPosition);

            yPosition += 12;

            // Contexto RAG
            if (modelo.contexto_rag && modelo.contexto_rag.length > 0) {
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0, 0, 0);
                pdf.text('Documentación Técnica:', 18, yPosition);
                yPosition += 6;

                modelo.contexto_rag.forEach((ctx, ctxIdx) => {
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
                    const lines = pdf.splitTextToSize(ctx.texto, pageWidth - 45);
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
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(
                `Página ${i} de ${totalPages} | Generado por ABDElevators RAG System`,
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
