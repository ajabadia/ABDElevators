import { renderBaseLayout } from './base-template';

/**
 * Template for Payment Failed Emails
 */
export function renderPaymentFailedEmail(params: {
    tenantName: string;
    amount: string;
    currency: string;
    attemptCount: number;
}) {
    const { tenantName, amount, currency, attemptCount } = params;

    const content = `
        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
            <h2 style="margin-top: 0; color: #dc2626;">⚠️ Pago Rechazado</h2>
            <p style="margin: 0; font-size: 16px;">
                No pudimos procesar tu pago de <strong>${amount} ${currency.toUpperCase()}</strong>.
            </p>
        </div>

        <p>Hola ${tenantName},</p>
        
        <p>
            Intentamos cobrar tu suscripción pero el pago fue rechazado por tu entidad financiera. 
            ${attemptCount > 1 ? `Este es el intento #${attemptCount}.` : ''}
        </p>

        <p><strong>Razones comunes de rechazo:</strong></p>
        <ul style="color: #475569;">
            <li>Fondos insuficientes o límite excedido.</li>
            <li>Tarjeta vencida o datos incorrectos.</li>
            <li>Operación bloqueada por seguridad bancaria.</li>
        </ul>

        <p>Por favor, actualiza tu método de pago lo antes posible para evitar la suspensión temporal de tu cuenta y servicios RAG.</p>

        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/billing" class="cta-button" style="background: #dc2626;">
                Actualizar Método de Pago
            </a>
        </div>
    `;

    return renderBaseLayout('Problema de Pago', 'Acción requerida', content, 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)');
}
