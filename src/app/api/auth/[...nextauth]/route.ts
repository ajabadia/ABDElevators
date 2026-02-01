import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';

async function logRequest(req: NextRequest) {
    const url = new URL(req.url);
    const method = req.method;

    console.log(`🚀 [AUTH_ROUTE_INTERCEPT] ${method} ${url.pathname}`);
    console.log(`📍 [AUTH_ROUTE_HEADERS]`, {
        host: req.headers.get("host"),
        origin: req.headers.get("origin"),
        referer: req.headers.get("referer"),
        "x-forwarded-host": req.headers.get("x-forwarded-host"),
        "auth-url": process.env.AUTH_URL || "not-set"
    });

    if (method === "POST") {
        try {
            // Keep a clone for the actual handler
            const clone = req.clone();
            const body = await clone.formData();
            console.log(`📦 [AUTH_ROUTE_BODY] FormData Keys:`, Array.from(body.keys()));
        } catch (e) {
            console.log(`📦 [AUTH_ROUTE_BODY] Error parsing body as FormData`);
        }
    }
}

export async function GET(req: NextRequest) {
    await logRequest(req);
    return handlers.GET(req);
}

export async function POST(req: NextRequest) {
    await logRequest(req);
    return handlers.POST(req);
}
