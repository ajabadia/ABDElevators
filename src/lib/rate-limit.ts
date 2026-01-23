import { NextResponse } from 'next/server';

/**
 * Basic in-memory rate limiter for serverless environment.
 * Note: Since Next.js Edge/Middleware instances are ephemeral,
 * this provides "soft" rate limiting per instance.
 * For production persistence, use Upstash Redis.
 */

interface RateLimitStore {
    [key: string]: {
        count: number;
        reset: number;
    };
}

const store: RateLimitStore = {};

// Clean up store periodically
setInterval(() => {
    const now = Date.now();
    for (const key in store) {
        if (store[key].reset < now) {
            delete store[key];
        }
    }
}, 1000 * 60 * 5); // Cada 5 minutos

export interface RateLimitOptions {
    limit: number;
    windowMs: number;
}

export async function rateLimit(key: string, options: RateLimitOptions) {
    const now = Date.now();
    const entry = store[key];

    if (!entry || entry.reset < now) {
        store[key] = {
            count: 1,
            reset: now + options.windowMs
        };
        return {
            success: true,
            limit: options.limit,
            remaining: options.limit - 1,
            reset: store[key].reset
        };
    }

    entry.count++;

    if (entry.count > options.limit) {
        return {
            success: false,
            limit: options.limit,
            remaining: 0,
            reset: entry.reset
        };
    }

    return {
        success: true,
        limit: options.limit,
        remaining: options.limit - entry.count,
        reset: entry.reset
    };
}
