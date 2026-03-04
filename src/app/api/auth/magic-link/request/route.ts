import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { logEvento } from '@/lib/logger';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';

const RequestMagicLinkSchema = z.object({
    email: z.string().email(),
});

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success, reset } = await checkRateLimit(ip, LIMITS.AUTH);

        if (!success) {
            return NextResponse.json(
                { error: "Too many requests" },
                { status: 429, headers: { "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString() } }
            );
        }

        const body = await req.json();
        const { email } = RequestMagicLinkSchema.parse(body);
        const normalizedEmail = email.toLowerCase().trim();

        const db = await connectAuthDB();
        const user = await db.collection('users').findOne({ email: normalizedEmail });

        if (!user) {
            return NextResponse.json({ success: true, message: 'If the email exists, a link has been sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await db.collection('magic_links').insertOne({
            email: normalizedEmail, token, expiresAt, used: false, ip, createdAt: new Date(), userId: user._id
        });

        const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth-pages/magic-link/verify?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

        if (process.env.RESEND_API_KEY) {
            const { Resend } = await import('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'ABD RAG Platform <noreply@resend.dev>',
                to: normalizedEmail,
                subject: 'Your Login Link - ABD Elevators',
                html: `<p>Click here to login: <a href="${link}">${link}</a></p>`
            });
        }

        return NextResponse.json({ success: true, message: 'If the email exists, a link has been sent.' });

    } catch (error: unknown) {
        return handleApiError(error, 'AUTH_MAGIC_LINK', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/auth/magic-link/request', thresholdMs: 1000 });
