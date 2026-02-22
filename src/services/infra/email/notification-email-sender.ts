import { getResend } from '@/lib/resend-client';
import { logEvento } from '@/lib/logger';

export interface EmailOptions {
    from?: string;
    to: string | string[];
    subject: string;
    html: string;
}

export class NotificationEmailSender {
    /**
     * Sends an email using Resend.
     */
    static async send(options: EmailOptions): Promise<void> {
        const resend = getResend();
        if (!resend) {
            console.warn('[NotificationEmailSender] Resend client not available');
            return;
        }

        try {
            await resend.emails.send({
                from: options.from || process.env.RESEND_FROM_EMAIL || 'ABD RAG <notifications@abdrag.com>',
                to: options.to,
                subject: options.subject,
                html: options.html
            });

            console.log(`[NotificationEmailSender] Email sent successfully to ${Array.isArray(options.to) ? options.to.length : 1} recipients`);
        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'EMAIL_SENDER',
                action: 'SEND_EMAIL_ERROR',
                message: error.message || 'Failed to send email',
                details: { to: options.to, subject: options.subject },
                stack: error.stack
            });
            throw error;
        }
    }
}
