import { NextResponse } from 'next/server';
import { MiddlewareModule, logMiddlewareEvent, ExtendedUser } from './utils';

import { checkRateLimit, LIMITS } from '../lib/rate-limit';
import { sanitizer } from '../lib/sanitization';

/**
 * Handles API and Authentication rate limiting.
 */
export const rateLimiting: MiddlewareModule = async (request, session, correlationId) => {
    const { pathname } = request.nextUrl;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

    if (!pathname.startsWith('/api/')) return null;

    const isAuthTarget = pathname.startsWith('/api/auth');
    const limitConfig = isAuthTarget ? LIMITS.AUTH : LIMITS.CORE;
    const user = session?.user as ExtendedUser | undefined;
    const tenantId = user?.tenantId;


    const rateLimit = await checkRateLimit(ip, limitConfig, tenantId);

    if (!rateLimit.success) {
        await logMiddlewareEvent({
            correlationId,
            level: 'WARN',
            action: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit blocked ${sanitizer.ip(ip)} on ${sanitizer.path(pathname)}`,
            details: { ip: sanitizer.ip(ip), pathname: sanitizer.path(pathname), limit: rateLimit.limit },
            session
        });

        return new NextResponse(JSON.stringify({
            success: false,
            message: "Too many requests",
            retryAfter: rateLimit.reset
        }), {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': rateLimit.limit.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-RateLimit-Reset': rateLimit.reset.toString(),
                'X-RateLimit-Tenant-ID': tenantId || 'anonymous',
                'Retry-After': Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000)).toString()
            }
        });
    }

    return null;
};
