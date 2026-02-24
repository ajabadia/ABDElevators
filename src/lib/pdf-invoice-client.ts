
import jsPDF from 'jspdf';
import { InvoiceData } from '@/services/admin/BillingService';
import { BillingService } from '@/services/admin/BillingService';
import { PdfLayout } from './pdf/PdfLayout';
import { PdfTheme } from './pdf/PdfTheme';

/**
 * generateInvoicePDF - Generates a standardized invoice document.
 * Phase 8.1: Service consolidation.
 */
export const generateInvoicePDF = (invoice: InvoiceData, locale: string = 'es') => {
    const doc = new jsPDF();
    const theme = PdfTheme.getTheme(locale, (invoice.tenant as any).industry);
    const pageWidth = doc.internal.pageSize.getWidth();

    // Attach Metadata
    PdfLayout.attachDocumentMetadata(doc, {
        tenantId: invoice.tenant.id,
        correlationId: invoice.id, // Assuming invoice ID as trace
        generatedBy: 'BillingEngine'
    });

    // --- Header unificado ---
    PdfLayout.drawStandardHeader(doc, {
        title: locale === 'es' ? 'FACTURA' : 'INVOICE',
        subtitle: `# ${invoice.number || 'DRAFT'}`,
        locale,
        industry: (invoice.tenant as any).industry || 'GENERIC'
    });

    doc.setTextColor(theme.colors.secondary);
    doc.setFontSize(PdfTheme.FONTS.BODY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${locale === 'es' ? 'Fecha' : 'Date'}: ${PdfTheme.formatDate(new Date(invoice.issueDate), locale)}`, pageWidth - PdfTheme.MARGINS.RIGHT, 32, { align: 'right' });

    // --- Emisor (Plataforma) ---
    doc.setFont('helvetica', 'bold');
    doc.text('ABD Elevators SaaS', PdfTheme.MARGINS.LEFT, 55);
    doc.setFont('helvetica', 'normal');
    doc.text('CIF: B-99999999', PdfTheme.MARGINS.LEFT, 60);
    doc.text('Calle Innovación 10', PdfTheme.MARGINS.LEFT, 65);
    doc.text('28000 Madrid, España', PdfTheme.MARGINS.LEFT, 70);

    // --- Cliente ---
    doc.setFont('helvetica', 'bold');
    doc.text(locale === 'es' ? 'Facturar a:' : 'Bill to:', pageWidth - 80, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.tenant.fiscalName || invoice.tenant.name, pageWidth - 80, 60);
    if (invoice.tenant.taxId) doc.text(`CIF/NIF: ${invoice.tenant.taxId}`, pageWidth - 80, 65);
    if (invoice.tenant.address) {
        doc.text(invoice.tenant.address, pageWidth - 80, 70, { maxWidth: 60 });
    }

    // --- Tabla Conceptos ---
    let yPos = 90;

    // Header Row
    doc.setFillColor(theme.colors.background);
    doc.rect(PdfTheme.MARGINS.LEFT, yPos, pageWidth - (PdfTheme.MARGINS.LEFT + PdfTheme.MARGINS.RIGHT), 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(locale === 'es' ? 'Descripción' : 'Description', PdfTheme.MARGINS.LEFT + 5, yPos + 7);
    doc.text(locale === 'es' ? 'Cant' : 'Qty', pageWidth - 60, yPos + 7, { align: 'right' });
    doc.text(locale === 'es' ? 'Precio U.' : 'Unit Price', pageWidth - 40, yPos + 7, { align: 'right' });
    doc.text('Total', pageWidth - 25, yPos + 7, { align: 'right' });

    yPos += 18;

    // Items
    doc.setFont('helvetica', 'normal');
    invoice.lineItems.forEach(item => {
        yPos = PdfLayout.ensurePageSpace(doc, yPos, 10);
        doc.text(item.description, PdfTheme.MARGINS.LEFT + 5, yPos);
        doc.text(item.quantity.toString(), pageWidth - 60, yPos, { align: 'right' });
        doc.text(PdfTheme.formatCurrency(item.unitPrice, locale), pageWidth - 40, yPos, { align: 'right' });
        doc.text(PdfTheme.formatCurrency(item.total, locale), pageWidth - 25, yPos, { align: 'right' });
        yPos += 10;
    });

    // --- Totales ---
    yPos += 10;
    doc.setDrawColor(theme.colors.muted);
    doc.line(PdfTheme.MARGINS.LEFT, yPos, pageWidth - PdfTheme.MARGINS.RIGHT, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', pageWidth - 60, yPos, { align: 'right' });
    doc.text(PdfTheme.formatCurrency(invoice.subtotal, locale), pageWidth - 25, yPos, { align: 'right' });
    yPos += 8;

    doc.text(`IVA (${(invoice.taxRate * 100).toFixed(0)}%):`, pageWidth - 60, yPos, { align: 'right' });
    doc.text(PdfTheme.formatCurrency(invoice.taxAmount, locale), pageWidth - 25, yPos, { align: 'right' });
    yPos += 12;

    doc.setFillColor(theme.colors.background);
    doc.rect(pageWidth - 85, yPos - 8, 65, 14, 'F');
    doc.setTextColor(theme.colors.primary);
    doc.setFontSize(PdfTheme.FONTS.SECTION);
    doc.text('TOTAL:', pageWidth - 60, yPos + 2, { align: 'right' });
    doc.text(PdfTheme.formatCurrency(invoice.total, locale), pageWidth - 25, yPos + 2, { align: 'right' });

    // --- Footer unificado ---
    PdfLayout.drawStandardFooter(doc, undefined, locale);

    doc.save(`factura_${invoice.number}.pdf`);
};
