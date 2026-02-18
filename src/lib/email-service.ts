import { getResend } from '@/lib/resend-client';
import { renderLimitAlertEmail } from './emails/limit-alert';
import { renderPaymentFailedEmail } from './emails/payment-failed';
import { renderInvitationEmail } from './emails/invitation';
import { renderMfaEnabledEmail } from './emails/mfa-enabled';
import { renderNewInvoiceEmail } from './emails/new-invoice';


export async function sendLimitAlert(params: {
    to: string;
    tenantName: string;
    resourceType: 'tokens' | 'storage' | 'searches' | 'api_requests';
    currentUsage: number;
    limit: number;
    percentage: number;
    tier: string;
}): Promise<void> {
    const { to, tenantName, resourceType, currentUsage, limit, percentage, tier } = params;
    const resend = getResend();

    const resourceNames = {
        tokens: 'Tokens de IA',
        storage: 'Almacenamiento',
        searches: 'Búsquedas Vectoriales',
        api_requests: 'Llamadas API',
    };

    const subject = percentage >= 100
        ? `⚠️ Límite de ${resourceNames[resourceType]} Excedido - ABD RAG Platform`
        : `⚠️ Alerta: ${percentage.toFixed(0)}% de ${resourceNames[resourceType]} Consumido`;

    const html = renderLimitAlertEmail({
        tenantName,
        resourceName: resourceNames[resourceType],
        currentUsage: formatValue(currentUsage, resourceType),
        limit: formatValue(limit, resourceType),
        percentage,
        tier
    });

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@abdrag.com>',
        to,
        subject,
        html,
    });
}

export async function sendPaymentFailedEmail(params: {
    to: string;
    tenantName: string;
    amount: number;
    currency: string;
    attemptCount: number;
}): Promise<void> {
    const { to, tenantName, amount, currency, attemptCount } = params;
    const resend = getResend();

    const html = renderPaymentFailedEmail({
        tenantName,
        amount: amount.toFixed(2),
        currency,
        attemptCount
    });

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@abdrag.com>',
        to,
        subject: '⚠️ Problema con tu Pago - ABD RAG Platform',
        html,
    });
}

function formatValue(value: number, type: string): string {
    switch (type) {
        case 'tokens':
            return `${(value / 1000).toLocaleString()}k tokens`;
        case 'storage':
            const gb = value / (1024 * 1024 * 1024);
            return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(value / (1024 * 1024)).toFixed(2)} MB`;
        case 'searches':
        case 'api_requests':
            return value.toLocaleString();
        default:
            return value.toString();
    }
}

export async function sendInvitationEmail(params: {
    to: string;
    inviterName: string;
    tenantName: string;
    role: string;
    inviteUrl: string;
}): Promise<void> {
    const { to, inviterName, tenantName, role, inviteUrl } = params;
    const resend = getResend();

    const roleNames = {
        SUPER_ADMIN: 'Super Administrador Global',
        ADMIN: 'Administrador de Organización',
        TECHNICAL: 'Técnico Especialista',
        ENGINEERING: 'Ingeniero de Proyectos',
        ADMINISTRATIVE: 'Personal Administrativo',
    };

    const friendlyRole = roleNames[role as keyof typeof roleNames] || role;

    const html = renderInvitationEmail({
        inviterName,
        tenantName,
        friendlyRole,
        inviteUrl
    });

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@abdrag.com>',
        to,
        subject: `Invitación de ${inviterName} para unirte a ${tenantName}`,
        html,
    });
}

export async function sendMfaEnabledEmail(params: {
    to: string;
    userName: string;
}): Promise<void> {
    const { to, userName } = params;
    const resend = getResend();
    const html = renderMfaEnabledEmail({ userName });

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@abdrag.com>',
        to,
        subject: '🛡️ MFA Activado - ABD RAG Platform',
        html,
    });
}

export async function sendNewInvoiceNotification(params: {
    to: string;
    tenantName: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    month: string;
}): Promise<void> {
    const { to, tenantName, invoiceNumber, amount, currency, month } = params;
    const resend = getResend();

    const html = renderNewInvoiceEmail({
        tenantName,
        invoiceNumber,
        amount: amount.toFixed(2),
        currency,
        month
    });

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@abdrag.com>',
        to,
        subject: `Factura ${invoiceNumber} - ABD RAG Platform`,
        html,
    });
}

/**
 * Sends a scheduled report with PDF attachment.
 */
export async function sendReportDelivery(params: {
    to: string;
    reportName: string;
    templateType: string;
    generatedAt: Date;
    pdfBuffer: Buffer;
    fileName: string;
}): Promise<void> {
    const { to, reportName, templateType, generatedAt, pdfBuffer, fileName } = params;

    // Dynamic import to avoid circular dependencies if any, though here it's fine.
    // Ideally imports should be at top, but for this append operation:
    const { renderReportDeliveryEmail } = await import('./emails/report-delivery');

    const resend = getResend();

    const html = renderReportDeliveryEmail({
        reportName,
        templateType,
        generatedAt
    });

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@abdrag.com>',
        to,
        subject: `📊 Informe Disponible: ${reportName}`,
        html,
        attachments: [
            {
                filename: fileName,
                content: pdfBuffer,
            }
        ]
    });
}
