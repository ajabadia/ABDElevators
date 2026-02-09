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
}

/**
 * Generates a PDF on the server from the content of an LLM report.
 * Designed to run in Node.js environments (Vercel).
 */
export async function generateServerPDF(data: LLMReportPDFData): Promise<Buffer> {
    const start = Date.now();
    const locale = data.locale || 'es';

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
    doc.setFillColor(13, 148, 136); // Teal-600
    doc.rect(0, 0, pageWidth, 40, 'F');

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
    doc.text(`${t.client}: ${data.client}`, margin, y);
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

            const cleanLine = line.replace(/\*\*/g, '');
            const wrappedText = doc.splitTextToSize(cleanLine, contentWidth);

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

        const pageLabel = t.page
            .replace('{current}', i.toString())
            .replace('{total}', totalPages.toString());

        doc.text(
            `${pageLabel} | ${t.automaticFootnote}`,
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
        details: { durationMs: duration, pages: totalPages }
    });

    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
}
