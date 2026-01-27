import jsPDF from 'jspdf';
import { InvoiceData } from '@/lib/billing-service';

export const generateInvoicePDF = (invoice: InvoiceData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Header ---
    doc.setFillColor(13, 148, 136); // Teal-600
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const invoiceNum = invoice.number || 'DRAFT';
    doc.text(`# ${invoiceNum}`, pageWidth - 20, 20, { align: 'right' });
    doc.text(`Fecha: ${new Date(invoice.issueDate).toLocaleDateString()}`, pageWidth - 20, 28, { align: 'right' });

    // --- Emisor (Plataforma) ---
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ABD Elevators SaaS', 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.text('CIF: B-99999999', 20, 60);
    doc.text('Calle Innovación 10', 20, 65);
    doc.text('28000 Madrid, España', 20, 70);

    // --- Cliente ---
    doc.setFont('helvetica', 'bold');
    doc.text('Facturar a:', pageWidth - 80, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.tenant.fiscalName || invoice.tenant.name, pageWidth - 80, 60);
    if (invoice.tenant.taxId) doc.text(`CIF/NIF: ${invoice.tenant.taxId}`, pageWidth - 80, 65);
    if (invoice.tenant.address) {
        doc.text(invoice.tenant.address, pageWidth - 80, 70, { maxWidth: 60 });
    }

    // --- Tabla Conceptos ---
    let yPos = 90;

    // Header Row
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, pageWidth - 40, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción', 25, yPos + 7);
    doc.text('Cant', pageWidth - 60, yPos + 7, { align: 'right' });
    doc.text('Precio U.', pageWidth - 40, yPos + 7, { align: 'right' });
    doc.text('Total', pageWidth - 25, yPos + 7, { align: 'right' });

    yPos += 18;

    // Items
    doc.setFont('helvetica', 'normal');
    invoice.lineItems.forEach(item => {
        doc.text(item.description, 25, yPos);
        doc.text(item.quantity.toString(), pageWidth - 60, yPos, { align: 'right' });
        doc.text(item.unitPrice.toFixed(2) + ' €', pageWidth - 40, yPos, { align: 'right' });
        doc.text(item.total.toFixed(2) + ' €', pageWidth - 25, yPos, { align: 'right' });
        yPos += 10;
    });

    // --- Totales ---
    yPos += 10;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');

    doc.text('Subtotal:', pageWidth - 60, yPos, { align: 'right' });
    doc.text(invoice.subtotal.toFixed(2) + ' €', pageWidth - 25, yPos, { align: 'right' });
    yPos += 8;

    doc.text(`IVA (${(invoice.taxRate * 100).toFixed(0)}%):`, pageWidth - 60, yPos, { align: 'right' });
    doc.text(invoice.taxAmount.toFixed(2) + ' €', pageWidth - 25, yPos, { align: 'right' });
    yPos += 12;

    doc.setFillColor(245, 255, 255); // Light Teal
    doc.rect(pageWidth - 85, yPos - 8, 65, 14, 'F');
    doc.setTextColor(13, 148, 136); // Teal-600
    doc.setFontSize(12);
    doc.text('TOTAL:', pageWidth - 60, yPos + 2, { align: 'right' });
    doc.text(invoice.total.toFixed(2) + ' €', pageWidth - 25, yPos + 2, { align: 'right' });

    // --- Footer ---
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    const bottom = doc.internal.pageSize.getHeight() - 20;
    doc.text('Gracias por su confianza. Documento generado electrónicamente.', 20, bottom);

    doc.save(`factura_${invoice.number}.pdf`);
};
