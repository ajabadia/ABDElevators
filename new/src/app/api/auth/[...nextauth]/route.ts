import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";

export const runtime = 'nodejs';

async function logRequest(req: NextRequest) {
    const url = new URL(req.url);
    const method = req.method;

    console.log(`🚀 [AUTH_ROUTE_INTERCEPT] ${method} ${url.pathname}`);
    // Reduced verbosity for production
    if (process.env.NODE_ENV === 'development') {
        console.log(`📍 [AUTH_ROUTE_HEADERS]`, {
            host: req.headers.get("host"),
            "x-forwarded-host": req.headers.get("x-forwarded-host"),
        });
    }
}

export async function GET(req: NextRequest) {
    // SECURITY: Rate Limit Session Polling (Core Limit)
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success, reset } = await checkRateLimit(ip, LIMITS.CORE);

    if (!success) {
        return new NextResponse("Too Many Requests", {
            status: 429,
            headers: { "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString() }
        });
    }

    await logRequest(req);
    return handlers.GET(req);
}

export async function POST(req: NextRequest) {
    // SECURITY: Rate Limit Login/Signup Attempts (Strict Auth Limit)
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success, reset } = await checkRateLimit(ip, LIMITS.AUTH);

    if (!success) {
        console.warn(`⚠️ Auth Rate Limit Exceeded for IP: ${ip}`);
        return new NextResponse("Too Many Requests", {
            status: 429,
            headers: { "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString() }
        });
    }

    await logRequest(req);
    return handlers.POST(req);
}
