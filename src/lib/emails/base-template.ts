/**
 * Base Email Layout & Styles (Phase 105 Hygiene)
 */
export const baseEmailStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 40px; }
    .divider { height: 1px; background: #e2e8f0; margin: 30px 0; }
    .cta-button { display: inline-block; background: #0d9488; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 30px 0; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
`;

export function renderBaseLayout(title: string, subtitle: string, content: string, headerColor?: string) {
    const customHeader = headerColor ? `background: ${headerColor};` : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>${baseEmailStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header" style="${customHeader}">
                <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.025em;">ABD RAG Platform</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">${subtitle}</p>
            </div>
            <div class="content">
                ${content}
                <div class="footer">
                    <p>© 2026 ABD RAG Platform. Todos los derechos reservados.</p>
                    <p>Seguridad y Privacidad de Grado Bancario.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}
