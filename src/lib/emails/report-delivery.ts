import { renderBaseLayout } from './base-template';

interface ReportDeliveryEmailProps {
    recipientName?: string;
    reportName: string;
    templateType: string;
    generatedAt: Date;
    tenantName?: string;
}

export const renderReportDeliveryEmail = ({
    recipientName,
    reportName,
    templateType,
    generatedAt,
    tenantName = 'ABD RAG Platform'
}: ReportDeliveryEmailProps) => {
    const formattedDate = new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'full',
        timeStyle: 'short'
    }).format(generatedAt);

    const content = `
        <h2 style="color: #1e293b; margin-bottom: 20px;">Su informe programado está listo</h2>
        
        <p style="margin-bottom: 16px;">
            Hola${recipientName ? `, ${recipientName}` : ''}:
        </p>
        
        <p style="margin-bottom: 24px;">
            Adjunto encontrará el informe <strong>"${reportName}"</strong> generado automáticamente por el sistema.
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #0d9488; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0;"><strong>Tipo de Informe:</strong> ${templateType}</p>
            <p style="margin: 0 0 8px 0;"><strong>Fecha Generación:</strong> ${formattedDate}</p>
            <p style="margin: 0;"><strong>Organización:</strong> ${tenantName}</p>
        </div>

        <p style="font-size: 14px; color: #64748b;">
            Este informe se ha generado automáticamente según su programación. Si desea modificar la frecuencia o destinatarios, por favor acceda al panel de administración.
        </p>
    `;

    return renderBaseLayout(
        'Informe Programado Disponible',
        `Generado el ${formattedDate}`,
        content
    );
};
