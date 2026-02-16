import { Resend } from 'resend';

let resendInstance: Resend | null = null;

/**
 * Obtiene la instancia de Resend (lazy initialization)
 */
function getResend(): Resend {
    if (!resendInstance) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not defined in environment variables');
        }
        resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance;
}

/**
 * Envía un email de alerta de límite de consumo
 */
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

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: ${percentage >= 100 ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${percentage >= 100 ? '#dc2626' : '#f59e0b'}; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .stat-label { font-weight: 600; color: #64748b; }
        .stat-value { font-weight: 700; color: #0f172a; }
        .progress-bar { background: #e2e8f0; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { background: ${percentage >= 100 ? '#dc2626' : percentage >= 80 ? '#f59e0b' : '#0d9488'}; height: 100%; width: ${Math.min(percentage, 100)}%; transition: width 0.3s; }
        .cta-button { display: inline-block; background: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">ABD RAG Platform</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Alerta de Consumo</p>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <h2 style="margin-top: 0; color: ${percentage >= 100 ? '#dc2626' : '#f59e0b'};">
                    ${percentage >= 100 ? '⚠️ Límite Excedido' : '⚠️ Alerta de Consumo'}
                </h2>
                <p style="margin: 0; font-size: 16px;">
                    ${percentage >= 100
            ? `Has alcanzado el <strong>100%</strong> de tu límite de ${resourceNames[resourceType]}.`
            : `Has consumido el <strong>${percentage.toFixed(1)}%</strong> de tu límite de ${resourceNames[resourceType]}.`
        }
                </p>
            </div>

            <div class="stats">
                <h3 style="margin-top: 0; color: #0f172a;">Detalles de Consumo</h3>
                
                <div class="stat-row">
                    <span class="stat-label">Organización:</span>
                    <span class="stat-value">${tenantName}</span>
                </div>
                
                <div class="stat-row">
                    <span class="stat-label">Plan Actual:</span>
                    <span class="stat-value">${tier}</span>
                </div>
                
                <div class="stat-row">
                    <span class="stat-label">Recurso:</span>
                    <span class="stat-value">${resourceNames[resourceType]}</span>
                </div>
                
                <div class="stat-row">
                    <span class="stat-label">Consumo Actual:</span>
                    <span class="stat-value">${formatValue(currentUsage, resourceType)}</span>
                </div>
                
                <div class="stat-row" style="border-bottom: none;">
                    <span class="stat-label">Límite del Plan:</span>
                    <span class="stat-value">${formatValue(limit, resourceType)}</span>
                </div>

                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <p style="text-align: center; margin: 5px 0 0 0; font-size: 14px; color: #64748b;">
                    ${percentage.toFixed(1)}% utilizado
                </p>
            </div>

            ${percentage >= 100 ? `
                <p style="background: #fee2e2; padding: 15px; border-radius: 6px; color: #991b1b;">
                    <strong>⚠️ Servicio Suspendido:</strong> Tu cuenta ha sido temporalmente suspendida debido al exceso de consumo. 
                    Por favor, actualiza tu plan para continuar usando la plataforma.
                </p>
            ` : `
                <p style="color: #475569;">
                    Te recomendamos actualizar tu plan para evitar interrupciones en el servicio.
                </p>
            `}

            <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/upgrade" class="cta-button">
                    Actualizar Plan Ahora
                </a>
            </div>

            <div class="footer">
                <p>Este es un email automático de ABD RAG Platform.</p>
                <p>Si tienes preguntas, contacta a <a href="mailto:support@abdrag.com">support@abdrag.com</a></p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@abdrag.com>',
        to,
        subject,
        html,
    });
}

/**
 * Envía un email cuando un pago falla
 */
export async function sendPaymentFailedEmail(params: {
    to: string;
    tenantName: string;
    amount: number;
    currency: string;
    attemptCount: number;
}): Promise<void> {
    const { to, tenantName, amount, currency, attemptCount } = params;

    const resend = getResend();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .cta-button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">ABD RAG Platform</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Problema con el Pago</p>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <h2 style="margin-top: 0; color: #dc2626;">⚠️ Pago Rechazado</h2>
                <p style="margin: 0; font-size: 16px;">
                    No pudimos procesar tu pago de <strong>${amount.toFixed(2)} ${currency.toUpperCase()}</strong>.
                </p>
            </div>

            <p>Hola ${tenantName},</p>
            
            <p>
                Intentamos cobrar tu suscripción pero el pago fue rechazado. 
                ${attemptCount > 1 ? `Este es el intento #${attemptCount}.` : ''}
            </p>

            <p>
                <strong>Razones comunes:</strong>
            </p>
            <ul>
                <li>Fondos insuficientes</li>
                <li>Tarjeta vencida</li>
                <li>Límite de crédito alcanzado</li>
                <li>Tarjeta bloqueada por el banco</li>
            </ul>

            <p>
                Por favor, actualiza tu método de pago para evitar la suspensión de tu cuenta.
            </p>

            <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/billing" class="cta-button">
                    Actualizar Método de Pago
                </a>
            </div>

            <div class="footer">
                <p>Si tienes preguntas, contacta a <a href="mailto:support@abdrag.com">support@abdrag.com</a></p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@abdrag.com>',
        to,
        subject: '⚠️ Problema con tu Pago - ABD RAG Platform',
        html,
    });
}

/**
 * Helper para formatear valores según el tipo de recurso
 */
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

/**
 * Envía un email de invitación a la plataforma
 */
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

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .invite-box { background: #f0fdfa; border: 1px border #99f6e4; padding: 25px; margin: 25px 0; border_radius: 8px; text-align: center; }
        .role-badge { display: inline-block; background: #ccfbf1; color: #0f766e; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 14px; margin-top: 10px; }
        .cta-button { display: inline-block; background: #0d9488; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 30px 0; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 40px; }
        .divider { height: 1px; background: #e2e8f0; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.025em;">ABD RAG Platform</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Invitación a la Plataforma</p>
        </div>
        
        <div class="content">
            <h2 style="margin-top: 0; color: #0f172a; font-size: 22px;">¡Hola!</h2>
            <p style="font-size: 16px; color: #475569;">
                <strong>${inviterName}</strong> te ha invitado a unirte a la organización <strong>${tenantName}</strong> en ABD RAG Platform.
            </p>

            <div class="invite-box">
                <p style="margin: 0; color: #0f766e; font-weight: 500;">Tu rol asignado será:</p>
                <span class="role-badge">${friendlyRole}</span>
            </div>

            <p style="font-size: 15px; color: #64748b;">
                Al unirte, tendrás acceso a las herramientas de análisis de pedidos, búsqueda técnica asistida por IA y gestión de cumplimiento de la plataforma.
            </p>

            <div style="text-align: center;">
                <a href="${inviteUrl}" class="cta-button">
                    Aceptar Invitación y Configurar Cuenta
                </a>
            </div>

            <p style="font-size: 13px; color: #94a3b8; text-align: center;">
                Este enlace expirará en 7 días por motivos de seguridad.
            </p>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
                Si no esperabas esta invitación, puedes ignorar este correo de forma segura.
            </p>

            <div class="footer">
                <p>© 2026 ABD RAG Platform. Todos los derechos reservados.</p>
                <p>Seguridad y Privacidad de Grado Bancario.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@abdrag.com>',
        to,
        subject: `Invitación de ${inviterName} para unirte a ${tenantName}`,
        html,
    });
}

/**
 * Envía un email de confirmación cuando se activa el MFA
 */
export async function sendMfaEnabledEmail(params: {
    to: string;
    userName: string;
}): Promise<void> {
    const { to, userName } = params;

    const resend = getResend();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none; }
        .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
        .security-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">ABD RAG Platform</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Seguridad de Cuenta</p>
        </div>
        
        <div class="content">
            <div class="success-box">
                <h2 style="margin-top: 0; color: #166534;">✅ MFA Activado</h2>
                <p style="margin: 0; font-size: 16px;">
                    La autenticación de dos factores ha sido activada correctamente en tu cuenta.
                </p>
            </div>

            <p>Hola ${userName},</p>
            
            <p>
                Tu cuenta ahora cuenta con una capa adicional de seguridad. A partir de ahora, se te solicitará un código generado por tu aplicación de autenticación cada vez que inicies sesión.
            </p>

            <p>
                <strong>¿Qué significa esto para ti?</strong>
            </p>
            <ul>
                <li>Mayor protección contra accesos no autorizados.</li>
                <li>Cumplimiento con estándares de seguridad enterprise.</li>
                <li>Tranquilidad al saber que tus datos están mejor protegidos.</li>
            </ul>

            <div style="background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #475569;">
                    Recuerda guardar tus <strong>códigos de recuperación</strong> en un lugar seguro. Si pierdes el acceso a tu dispositivo, estos códigos serán la única forma de recuperar tu cuenta.
                </p>
            </div>

            <p style="font-size: 14px; color: #64748b;">
                Si NO has activado esto tú mismo, por favor <strong>contacta a nuestro equipo de seguridad de inmediato</strong> respondiendo a este correo o a través del centro de soporte.
            </p>

            <div class="footer">
                <p>© 2026 ABD RAG Platform. Todos los derechos reservados.</p>
                <div class="security-badge">Cifrado de Extremo a Extremo</div>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@abdrag.com>',
        to,
        subject: '🛡️ MFA Activado - ABD RAG Platform',
        html,
    });
}

/**
 * Envía notificación de Nueva Factura Disponible
 */
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
    const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .invoice-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; margin: 25px 0; border-radius: 8px; }
        .amount { font-size: 32px; font-weight: 800; color: #0f172a; margin: 10px 0; }
        .cta-button { display: inline-block; background: #0d9488; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 30px 0; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">ABD RAG Platform</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Nueva Factura Disponible</p>
        </div>
        
        <div class="content">
            <p>Hola ${tenantName},</p>
            
            <p>
                Tu factura correspondiente al mes de <strong>${month}</strong> ya está disponible para su descarga.
            </p>

            <div class="invoice-box">
                <p style="margin: 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Importe Total</p>
                <div class="amount">${amount.toFixed(2)} ${currency}</div>
                <p style="margin: 0; color: #475569; font-size: 14px;">Nº Factura: <strong>${invoiceNumber}</strong></p>
            </div>

            <p style="color: #475569;">
                El cobro se procesará automáticamente en los próximos días a través de tu método de pago habitual.
            </p>

            <div style="text-align: center;">
                <a href="${invoiceUrl}" class="cta-button">
                    Ver y Descargar Factura
                </a>
            </div>

            <div class="footer">
                <p>© 2026 ABD RAG Platform. Todos los derechos reservados.</p>
                <p>Al hacer clic en el botón serás redirigido a tu panel de facturación seguro.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@abdrag.com>',
        to,
        subject: `Factura ${invoiceNumber} - ABD RAG Platform`,
        html,
    });
}
