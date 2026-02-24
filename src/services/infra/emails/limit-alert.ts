import { renderBaseLayout } from './base-template';

/**
 * Template for Consumption Limit Alerts
 */
export function renderLimitAlertEmail(params: {
    tenantName: string;
    resourceName: string;
    currentUsage: string;
    limit: string;
    percentage: number;
    tier: string;
}) {
    const { tenantName, resourceName, currentUsage, limit, percentage, tier } = params;
    const isExceeded = percentage >= 100;

    const content = `
        <div style="background: ${isExceeded ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${isExceeded ? '#dc2626' : '#f59e0b'}; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="margin-top: 0; color: ${isExceeded ? '#dc2626' : '#f59e0b'};">
                ${isExceeded ? '⚠️ Límite Excedido' : '⚠️ Alerta de Consumo'}
            </h2>
            <p style="margin: 0; font-size: 16px;">
                ${isExceeded
            ? `Has alcanzado el <strong>100%</strong> de tu límite de ${resourceName}.`
            : `Has consumido el <strong>${percentage.toFixed(1)}%</strong> de tu límite de ${resourceName}.`
        }
            </p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #0f172a;">Detalles de Consumo</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; color: #64748b;">Organización:</td><td style="padding: 10px 0; text-align: right; font-weight: 700;">${tenantName}</td></tr>
                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; color: #64748b;">Plan:</td><td style="padding: 10px 0; text-align: right; font-weight: 700;">${tier}</td></tr>
                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; color: #64748b;">Recurso:</td><td style="padding: 10px 0; text-align: right; font-weight: 700;">${resourceName}</td></tr>
                <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; color: #64748b;">Consumo:</td><td style="padding: 10px 0; text-align: right; font-weight: 700;">${currentUsage}</td></tr>
                <tr><td style="padding: 10px 0; color: #64748b;">Límite:</td><td style="padding: 10px 0; text-align: right; font-weight: 700;">${limit}</td></tr>
            </table>
            
            <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden; margin: 20px 0;">
                <div style="background: ${isExceeded ? '#dc2626' : '#0d9488'}; height: 100%; width: ${Math.min(percentage, 100)}%;"></div>
            </div>
            <p style="text-align: center; font-size: 12px; color: #64748b;">${percentage.toFixed(1)}% utilizado</p>
        </div>

        ${isExceeded ? `
            <p style="background: #fee2e2; padding: 15px; border-radius: 6px; color: #991b1b; margin-top: 20px;">
                <strong>⚠️ Servicio Suspendido:</strong> Para continuar, por favor actualiza tu plan.
            </p>
        ` : ''}

        <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/upgrade" class="cta-button">Actualizar Plan Ahora</a>
        </div>
    `;

    return renderBaseLayout(
        'Alerta de Consumo',
        'Monitor de Cuotas',
        content,
        isExceeded ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : undefined
    );
}
