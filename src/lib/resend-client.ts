import { Resend } from 'resend';

let resendInstance: Resend | null = null;

/**
 * Obtiene o inicializa la instancia única de Resend.
 * @returns Instancia de Resend
 * @throws Error si RESEND_API_KEY no está definida
 */
export function getResend(): Resend {
    if (!resendInstance) {
        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not defined in environment variables');
            throw new Error('RESEND_API_KEY is not defined in environment variables');
        }
        resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance;
}
