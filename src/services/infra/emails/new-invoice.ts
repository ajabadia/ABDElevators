import { renderBaseLayout } from './base-template';

/**
 * Template for New Invoice Notifications
 */
export function renderNewInvoiceEmail(params: {
    tenantName: string;
    invoiceNumber: string;
    amount: string;
    currency: string;
    month: string;
}) {
    const { tenantName, invoiceNumber, amount, currency, month } = params;

    const content = `
        <p>Hola ${tenantName},</p>
        
        <p>
            Tu factura de la plataforma correspondiente al mes de <strong>${month}</strong> ya está disponible.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">Importe Total</p>
            <div style="font-size: 36px; font-weight: 900; color: #0f172a; margin: 10px 0;">${amount} ${currency}</div>
            <p style="margin: 0; color: #475569; font-size: 14px;">Nº Factura: <strong>${invoiceNumber}</strong></p>
        </div>

        <p style="color: #475569;">
            El cargo se realizará de forma automática según tu plan contratado.
        </p>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/billing" class="cta-button">
                Ver Factura en el Panel
            </a>
        </div>
    `;

    return renderBaseLayout('Nueva Factura', 'Facturación Mensual', content);
}
