import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';
import { z } from 'zod';

// Schema for request body
const RequestMagicLinkSchema = z.object({
    email: z.string().email(),
});

export async function POST(req: NextRequest) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        await logEvento({
            level: 'INFO',
            source: 'AUTH_MAGIC_LINK',
            action: 'REQUEST_RECEIVED',
            message: 'New request received',
            correlationId
        });
        // 1. Rate Limiting (Strict)
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        // Using AUTH limit for now, maybe stricter? Let's use AUTH (10/5min)
        const { success, reset } = await checkRateLimit(ip, LIMITS.AUTH);

        if (!success) {
            await logEvento({
                level: 'WARN',
                source: 'AUTH_MAGIC_LINK',
                action: 'RATE_LIMIT',
                message: `Rate limit exceeded for IP: ${ip}`,
                correlationId
            });
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429, headers: { "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString() } }
            );
        }

        const body = await req.json();
        const { email } = RequestMagicLinkSchema.parse(body);
        const normalizedEmail = email.toLowerCase().trim();
        await logEvento({
            level: 'INFO',
            source: 'AUTH_MAGIC_LINK',
            action: 'CHECK_USER',
            message: `Checking user: ${normalizedEmail}`,
            correlationId
        });

        // 2. Validate User in AUTH DB
        const db = await connectAuthDB();
        const user = await db.collection('users').findOne({ email: normalizedEmail });

        if (!user) {
            console.warn('⚠️ [MAGIC_LINK] User not found in DB:', normalizedEmail);
            // Security: Always return success to prevent Email Enumeration
            await logEvento({
                level: 'WARN',
                source: 'AUTH_MAGIC_LINK',
                action: 'USER_NOT_FOUND',
                message: `Magic Link requested for non-existent email: ${normalizedEmail}`,
                correlationId
            });
            return NextResponse.json({ success: true, message: 'If the email exists, a link has been sent.' });
        }

        // 3. Generate Token & Save to AUTH DB
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await db.collection('magic_links').insertOne({
            email: normalizedEmail,
            token: token, // In prod, we should hash this, but for now we follow the plan
            expiresAt,
            used: false,
            ip,
            createdAt: new Date(),
            userId: user._id
        });

        // 4. Send Email
        const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth-pages/magic-link/verify?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

        let emailResult = null;
        let emailErrorDetail = null;

        if (process.env.RESEND_API_KEY) {
            try {
                const { Resend } = await import('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);

                console.error('📧 [MAGIC_LINK_TRACE] Attempting to send email to:', normalizedEmail);
                console.error('📧 [MAGIC_LINK_TRACE] From:', process.env.RESEND_FROM_EMAIL);

                emailResult = await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@resend.dev>',
                    to: normalizedEmail,
                    subject: 'Your Login Link - ABD Elevators',
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #0d9488;">ABD Elevators Login</h2>
                            <p>Click the button below to sign in directly.</p>
                            <a href="${link}" style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Sign In Now
                            </a>
                            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                                This link expires in 15 minutes.<br>
                                If you didn't request this, please ignore this email.
                            </p>
                        </div>
                    `
                });

                if (emailResult.error) {
                    throw emailResult.error;
                }

            } catch (error: any) {
                emailErrorDetail = {
                    message: error.message,
                    statusCode: error.statusCode || error.status,
                    name: error.name,
                    code: error.code
                };
            }
        }

        // In development, the link is still useful to have in logs
        if (process.env.NODE_ENV === 'development') {
            await logEvento({
                level: 'DEBUG',
                source: 'AUTH_MAGIC_LINK',
                action: 'DEV_TOKEN_LINK',
                message: link,
                correlationId
            });
        }

        await logEvento({
            level: emailErrorDetail ? 'ERROR' : (emailResult ? 'INFO' : 'WARN'),
            source: 'AUTH_MAGIC_LINK',
            action: emailErrorDetail ? 'EMAIL_FAILED' : (emailResult ? 'EMAIL_SENT' : 'NO_API_KEY'),
            message: emailErrorDetail
                ? `Failed to send magic link to ${normalizedEmail}`
                : `Magic link process completed for ${normalizedEmail}`,
            correlationId,
            details: {
                resendResponse: emailResult,
                error: emailErrorDetail,
                hasApiKey: !!process.env.RESEND_API_KEY,
                fromEmail: process.env.RESEND_FROM_EMAIL
            }
        });

        return NextResponse.json(
            { success: true, message: 'If the email exists, a link has been sent.' },
            { headers: { 'X-Debug-Magic': emailErrorDetail ? 'Handler-Executed-With-Email-Error' : 'Handler-Executed-Successfully' } }
        );

    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'AUTH_MAGIC_LINK',
            action: 'REQUEST_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });
        return NextResponse.json(
            { error: "An error occurred processing your request." },
            {
                status: 500,
                headers: { 'X-Debug-Magic': 'Handler-Error' }
            }
        );
    }
}
