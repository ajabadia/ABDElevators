import { jsPDF } from 'jspdf';
import { logEvento } from './logger';

interface LLMReportPDFData {
    numeroPedido: string;
    cliente: string;
    contenido: string; // Markdown
    tenantId: string;
    fecha: Date;
    tecnico: string;
}

/**
 * Genera un PDF en el servidor a partir del contenido de un informe LLM.
 * Diseñado para ejecutarse en entornos Node.js (Vercel).
 */
export async function generateServerPDF(data: LLMReportPDFData): Promise<Buffer> {
    const start = Date.now();

    // En Node.js, jspdf no tiene acceso a fuentes locales o DOM fácilmente,
    // pero podemos usar las fuentes estándar (Helvetica, Times, Courier).
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
    doc.setFillColor(13, 148, 136); // Teal-600
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('ABD RAG PLATFORM', margin, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('INFORME TÉCNICO PROFESIONAL (IA ASSISTED)', margin, 25);
    doc.text(`Tenant ID: ${data.tenantId} | Pedido: ${data.numeroPedido}`, margin, 32);

    y = 55;

    // Info Section
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Detalles del Informe', margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${data.cliente}`, margin, y);
    y += 5;
    doc.text(`Fecha: ${data.fecha.toLocaleString('es-ES')}`, margin, y);
    y += 5;
    doc.text(`Técnico Responsable: ${data.tecnico}`, margin, y);
    y += 15;

    // Contenido (Markdown simplificado)
    // jspdf no renderiza markdown nativamente, así que haremos un parseo básico
    // para manejar negritas y saltos de página.
    doc.setTextColor(0, 0, 0);
    const lines = data.contenido.split('\n');

    for (const line of lines) {
        // Salto de página preventivo
        if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
        }

        if (line.startsWith('# ')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text(line.substring(2), margin, y);
            y += 10;
        } else if (line.startsWith('## ')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(line.substring(3), margin, y);
            y += 8;
        } else if (line.startsWith('### ')) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(line.substring(4), margin, y);
            y += 6;
        } else if (line.trim() === '') {
            y += 4;
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            // Reemplazo básico de negritas **texto** -> solo quitamos los asteriscos para evitar glitches visuales
            // en este generador simple de servidor.
            const cleanLine = line.replace(/\*\*/g, '');

            const wrappedText = doc.splitTextToSize(cleanLine, contentWidth);

            // Verificar si el bloque cabe, si no, nueva página
            if (y + (wrappedText.length * 5) > pageHeight - 20) {
                doc.addPage();
                y = 20;
            }

            doc.text(wrappedText, margin, y);
            y += (wrappedText.length * 5) + 2;
        }
    }

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(
            `Página ${i} de ${totalPages} | Informe generado automáticamente por motor RAG v2.0`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    const duration = Date.now() - start;
    await logEvento({
        nivel: 'DEBUG',
        origen: 'SERVER_PDF_UTILS',
        accion: 'GENERATE_PDF',
        mensaje: `PDF generado en servidor para ${data.numeroPedido}`,
        correlacion_id: 'pdf-gen-' + Date.now(),
        detalles: { duration_ms: duration, pages: totalPages }
    });

    // En Node, output('arraybuffer') devuelve un Buffer-like
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
}
