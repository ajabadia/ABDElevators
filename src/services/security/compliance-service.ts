import { jsPDF } from 'jspdf';
import { PdfLayout } from '@/lib/pdf/PdfLayout';
import { PdfTheme } from '@/lib/pdf/PdfTheme';

/**
 * ComplianceService
 * Handles legal and compliance-related document generation.
 * Migrated to domain-driven security services in Phase 8.3.
 */
export class ComplianceService {

    /**
     * Generates a legal PDF certificate of data destruction.
     * To be sent to the user after a GDPR "Right to be Forgotten" request is processed.
     */
    static async generateDeletionCertificate(
        tenantId: string,
        requesterEmail: string,
        reason: string = "GDPR User Request",
        locale: string = 'es'
    ): Promise<Buffer> {
        const doc = new jsPDF();
        const theme = PdfTheme.getTheme(locale);
        const correlationId = `GDPR-${Date.now()}`;

        PdfLayout.attachDocumentMetadata(doc, { tenantId, correlationId });

        const t = locale === 'es' ? {
            title: "CERTIFICADO DE ELIMINACIÓN DE DATOS",
            subtitle: `GDPR Compliance - Tenant: ${tenantId.substring(0, 8)}`,
            body: [
                `Por la presente se certifica que ABD RAG Intelligence Platform ha procedido a la eliminación irreversible de todos los datos personales asociados al usuario:`,
                `Identificador: ${requesterEmail}`,
                `Motivo: ${reason}`,
                `Fecha de ejecución: ${PdfTheme.formatDate(new Date(), locale)}`,
                `Este proceso se ha realizado siguiendo los protocolos de seguridad de la plataforma y en cumplimiento con el Reglamento General de Protección de Datos (RGPD).`
            ]
        } : {
            title: "DATA DELETION CERTIFICATE",
            subtitle: `GDPR Compliance - Tenant: ${tenantId.substring(0, 8)}`,
            body: [
                `This document certifies that ABD RAG Intelligence Platform has proceeded with the irreversible deletion of all personal data associated with the user:`,
                `Identifier: ${requesterEmail}`,
                `Reason: ${reason}`,
                `Execution date: ${PdfTheme.formatDate(new Date(), locale)}`,
                `This process has been carried out following the platform security protocols and in compliance with the General Data Protection Regulation (GDPR).`
            ]
        };

        const y = PdfLayout.drawStandardHeader(doc, {
            title: t.title,
            subtitle: t.subtitle,
            correlationId,
            locale
        });

        let currentY = y + 20;
        doc.setFontSize(PdfTheme.FONTS.BODY);
        doc.setTextColor(theme.colors.secondary);
        doc.setFont('helvetica', 'normal');

        t.body.forEach(line => {
            const splitText = doc.splitTextToSize(line, 170);
            doc.text(splitText, PdfTheme.MARGINS.LEFT, currentY);
            currentY += (splitText.length * 7) + 5;
        });

        // Signature
        currentY += 20;
        doc.text(locale === 'es' ? 'Firmado digitalmente,' : 'Digitally Signed,', PdfTheme.MARGINS.LEFT, currentY);
        doc.setFont('helvetica', 'bold');
        doc.text('ABD Compliance Officer', PdfTheme.MARGINS.LEFT, currentY + 5);

        PdfLayout.drawStandardFooter(doc, correlationId, locale);

        return Buffer.from(doc.output('arraybuffer'));
    }
}
