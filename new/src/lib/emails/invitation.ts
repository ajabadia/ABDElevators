import { renderBaseLayout } from './base-template';

/**
 * Template for Invitation Emails
 */
export function renderInvitationEmail(params: {
    inviterName: string;
    tenantName: string;
    friendlyRole: string;
    inviteUrl: string;
}) {
    const { inviterName, tenantName, friendlyRole, inviteUrl } = params;

    const content = `
        <h2 style="margin-top: 0; color: #0f172a; font-size: 22px;">¡Hola!</h2>
        <p style="font-size: 16px; color: #475569;">
            <strong>${inviterName}</strong> te ha invitado a unirte a la organización <strong>${tenantName}</strong> en ABD RAG Platform.
        </p>

        <div style="background: #f0fdfa; border: 1px solid #99f6e4; padding: 25px; margin: 25px 0; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #0f766e; font-weight: 500;">Tu rol asignado será:</p>
            <span style="display: inline-block; background: #ccfbf1; color: #0f766e; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 14px; margin-top: 10px;">
                ${friendlyRole}
            </span>
        </div>

        <p style="font-size: 15px; color: #64748b;">
            Al unirte, tendrás acceso a las herramientas de análisis de pedidos, búsqueda técnica asistida por IA y gestión de cumplimiento de la plataforma.
        </p>

        <div style="text-align: center;">
            <a href="${inviteUrl}" class="cta-button">
                Aceptar Invitación y Configurar Cuenta
            </a>
        </div>

        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 20px;">
            Este enlace expirará en 7 días por motivos de seguridad.
        </p>
    `;

    return renderBaseLayout('Invitación', 'Únete a tu equipo', content);
}
