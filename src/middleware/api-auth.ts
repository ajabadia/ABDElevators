import { NextResponse } from 'next/server';
import { MiddlewareModule, logMiddlewareEvent } from './utils';
import { sanitizer } from '../lib/sanitization';

/**
 * Handles internal gateway authentication and external API Key validation.
 */
export const apiAuth: MiddlewareModule = async (request, session, correlationId) => {
    const { pathname } = request.nextUrl;
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

    // 1. Internal API Check (/api/internal/*)
    if (pathname.startsWith('/api/internal/')) {
        const internalSecret = request.headers.get("x-internal-secret");
        const expectedSecret = process.env.INTERNAL_API_SECRET;
        const previousSecret = process.env.PREVIOUS_INTERNAL_API_SECRET;

        const isAuthorizedSecret = 
            (expectedSecret && internalSecret === expectedSecret) ||
            (previousSecret && internalSecret === previousSecret);

        const allowedIps = (process.env.ALLOWED_INTERNAL_IPS || '').split(',').map(s => s.trim()).filter(Boolean);
        const isAuthorizedIp = allowedIps.length === 0 || allowedIps.includes(ip);

        if (!isAuthorizedSecret || !isAuthorizedIp) {
            await logMiddlewareEvent({
                correlationId,
                level: 'ERROR',
                action: 'UNAUTHORIZED_INTERNAL_ACCESS',
                message: `Intento de acceso interno no autorizado a ${sanitizer.path(pathname)}`,
                details: { ip: sanitizer.ip(ip), authSecretMatch: !!isAuthorizedSecret, ipMatch: !!isAuthorizedIp },
                session
            });
            return new NextResponse(JSON.stringify({ success: false, message: "Forbidden" }), { status: 403 });
        }
        return null; // Authorized internal access
    }

    // 2. API Key Authentication (External)
    const authHeader = request.headers.get('authorization');
    const apiKeyHeader = request.headers.get('x-api-key');
    const rawApiKey = apiKeyHeader || (authHeader?.startsWith('Bearer sk_') ? authHeader.replace('Bearer ', '') : null);

    if (rawApiKey && pathname.startsWith('/api/')) {
        const internalBase = process.env.INTERNAL_API_BASE_URL || 'http://localhost:3000';
        
        // 🛡️ [SSRF Mitigation] Era 12
        try {
            const internalUrlObj = new URL(internalBase);
            const ALLOWED_INTERNAL_HOSTS = (process.env.ALLOWED_INTERNAL_HOSTS || 'localhost,127.0.0.1,api.internal.abd.com').split(',').map(h => h.trim());
            
            if (!ALLOWED_INTERNAL_HOSTS.includes(internalUrlObj.hostname)) {
                await logMiddlewareEvent({
                    correlationId,
                    level: 'ERROR',
                    action: 'SSRF_ATTEMPT_BLOCKED',
                    message: `Internal base URL hostname not in whitelist: ${internalUrlObj.hostname}`,
                    session
                });
                return new NextResponse(JSON.stringify({ success: false, message: "Security Configuration Violation" }), { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } catch (e) {
            return new NextResponse(JSON.stringify({ success: false, message: "Invalid Internal Configuration" }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const internalUrl = `${internalBase}/api/internal/auth/validate-key`;
        const internalSecret = process.env.INTERNAL_API_SECRET;

        if (!internalSecret) {
            await logMiddlewareEvent({
                correlationId, level: 'ERROR', action: 'CONFIGURATION_ERROR', message: 'INTERNAL_API_SECRET missing', session
            });
            return new NextResponse("Configuration Error", { status: 500 });
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const validationResponse = await fetch(internalUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
                body: JSON.stringify({
                    rawKey: rawApiKey,
                    tenantId: request.headers.get('x-tenant-id'),
                    // Resource hints extraction logic could be moved to another utility if it grows
                    resourceIds: {
                        spaceId: pathname.match(/\/api\/spaces\/([a-f\d]{24})/i)?.[1],
                        assetId: pathname.match(/\/api\/assets\/([a-f\d]{24})/i)?.[1]
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (validationResponse.ok) {
                const { apiKey } = await validationResponse.json();
                const response = NextResponse.next();
                response.headers.set('x-tenant-id', apiKey.tenantId);
                response.headers.set('x-api-key-id', apiKey.id);
                return response;
            } else {
                const errorData = await validationResponse.json();
                return new NextResponse(JSON.stringify({ success: false, message: errorData.message || "Invalid API Key" }), { 
                    status: validationResponse.status, 
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown';
            // 🛡️ [SEC FIX] Use logMiddlewareEvent instead of console.error for API validation errors
            await logMiddlewareEvent({
                correlationId,
                level: 'ERROR',
                action: 'API_KEY_VALIDATION_ERROR',
                message: `Error validando API Key: ${errorMsg}`,
                details: { error: errorMsg, internalUrl },
                session
            });
            return new NextResponse(JSON.stringify({ success: false, message: "Authentication Service Unavailable" }), { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return null;
};
