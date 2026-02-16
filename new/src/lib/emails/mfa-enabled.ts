import { renderBaseLayout } from './base-template';

/**
 * Template for MFA Enabled confirmation
 */
export function renderMfaEnabledEmail(params: { userName: string }) {
    const { userName } = params;

    const content = `
        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
            <h2 style="margin-top: 0; color: #166534;">✅ MFA Activado</h2>
            <p style="margin: 0; font-size: 16px;">
                La autenticación de dos factores ha sido activada correctamente.
            </p>
        </div>

        <p>Hola ${userName},</p>
        
        <p>
            Tu cuenta ahora cuenta con una capa adicional de seguridad extra-robusta. Se te solicitará un código dinámico cada vez que inicies sesión.
        </p>

        <div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #475569;">
                <strong>⚠️ Recordatorio Crítico:</strong> Asegúrate de haber guardado tus códigos de recuperación. Si pierdes el dispositivo MFA y no tienes los códigos, podrías perder el acceso definitivo a tu cuenta.
            </p>
        </div>

        <p style="font-size: 14px; color: #64748b;">
            Si NO has realizado esta acción, contacta con soporte inmediatamente.
        </p>
    `;

    return renderBaseLayout('Seguridad', 'Protección de cuenta', content);
}
