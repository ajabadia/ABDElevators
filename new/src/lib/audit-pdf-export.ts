import jsPDF from 'jspdf';
import { ItemValidation, ChecklistConfig, Entity } from '@/lib/schemas';

interface AuditReportData {
    entity: Entity;
    config: ChecklistConfig;
    items: ItemValidation[];
    userName: string;
    durationMs: number;
    timestamp: Date;
    correlationId: string;
}

/**
 * Genera un PDF de auditoría para la validación de un pedido.
 * Documenta quién, cuándo y qué se validó, incluyendo notas técnicas.
 */
export async function generateAuditPDF(data: AuditReportData): Promise<Blob> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = 20;

    // Header
    pdf.setFillColor(51, 65, 85); // Slate-700
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AUDIT TRAIL - ABD RAG Plataform', 15, 18);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Documento de Validación Técnica | Entity: ${data.entity.identifier}`, 15, 28);
    pdf.text(`ID Seguimiento: ${data.correlationId}`, 15, 34);

    y = 55;

    // Resumen de Validación
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Resumen de la Sesión', 15, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Validador: ${data.userName}`, 15, y);
    pdf.text(`Fecha/Hora: ${data.timestamp.toLocaleString('es-ES')}`, 100, y);
    y += 6;
    pdf.text(`Duración de revisión: ${Math.floor(data.durationMs / 1000)} segundos`, 15, y);
    pdf.text(`Configuración aplicada: ${data.config.name}`, 100, y);
    y += 15;

    // Listado de Items
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Resultados de la Checklist', 15, y);
    y += 10;

    // Agrupar items por categoría para el PDF
    const itemsByCat: Record<string, typeof data.items> = {};
    data.items.forEach(item => {
        const fullItem = data.config.categories.flatMap(c => c.keywords).includes(item.itemId) ? '...' : item; // Simplificación
        // En un flujo real buscaríamos el texto del item original
    });

    data.items.forEach((item, index) => {
        if (y > pageHeight - 30) {
            pdf.addPage();
            y = 20;
        }

        // Fondo según estado
        if (item.status === 'OK') pdf.setFillColor(240, 253, 244); // Green-50
        else if (item.status === 'REVIEW') pdf.setFillColor(255, 251, 235); // Amber-50
        else pdf.setFillColor(248, 250, 252); // Slate-50

        pdf.rect(15, y - 5, pageWidth - 30, 20, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        const statusColor = item.status === 'OK' ? [21, 128, 61] : item.status === 'REVIEW' ? [180, 83, 9] : [100, 116, 139];
        pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        pdf.text(`[${item.status}]`, 18, y);

        pdf.setTextColor(30, 41, 59); // Slate-800
        pdf.text(`Punto de control #${index + 1}`, 45, y);

        y += 7;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105); // Slate-600
        const notes = item.notes || 'Sin observaciones técnicas adicionales.';
        const splitNotes = pdf.splitTextToSize(`Notas: ${notes}`, pageWidth - 45);
        pdf.text(splitNotes, 18, y);

        y += (splitNotes.length * 4) + 10;
    });

    // Footer de Firma
    if (y > pageHeight - 60) {
        pdf.addPage();
        y = 30;
    }

    y += 20;
    pdf.setDrawColor(203, 213, 225);
    pdf.line(15, y, 80, y);
    pdf.line(130, y, 195, y);
    y += 5;
    pdf.setFontSize(8);
    pdf.text('Firma del Técnico Responsable', 25, y);
    pdf.text('Sello de ABD RAG Plataform', 145, y);

    return pdf.output('blob');
}
