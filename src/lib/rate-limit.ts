import { NextResponse } from 'next/server';

/**
 * Basic in-memory rate limiter for serverless environment.
 * Note: Since Next.js Edge/Middleware instances are ephemeral,
 * this provides "soft" rate limiting per instance.
 * For production persistence, use Upstash Redis.
 */

import { connectDB } from './db';

/**
 * Atomic Rate Limiter using MongoDB (Atomic $inc).
 * Replaces the ephemeral in-memory store with a persistent, cluster-safe solution.
 */

export interface RateLimitOptions {
    limit: number;
    windowMs: number;
}

export async function rateLimit(key: string, options: RateLimitOptions) {
    const now = Date.now();
    const windowStart = now - (now % options.windowMs); // Floor to nearest window start (Fixed Window)

    // Key structure: rate_limit:IP_WINDOWSTART
    // This creates a unique key for each window period.
    const uniqueKey = `${key}_${windowStart}`;

    try {
        const db = await connectDB();
        const collection = db.collection('rate_limits');

        // Atomic Increment
        // upsert: true -> If not exists, insert with count: 0 (then $inc to 1)
        // $setOnInsert -> Sets 'reset' (expireAt) only on creation
        const result = await collection.findOneAndUpdate(
            { key: uniqueKey },
            {
                $inc: { count: 1 },
                $setOnInsert: {
                    reset: new Date(now + options.windowMs), // Used for TTL
                    createdAt: new Date()
                }
            },
            {
                upsert: true,
                returnDocument: 'after'
            }
        );

        if (!result) {
            // Should not happen with upsert: true
            throw new Error('Rate limit update failed');
        }

        const currentCount = result.count;
        const resetTime = result.reset ? result.reset.getTime() : (now + options.windowMs);

        const remaining = Math.max(0, options.limit - currentCount);

        return {
            success: currentCount <= options.limit,
            limit: options.limit,
            remaining: remaining,
            reset: resetTime
        };

    } catch (error) {
        console.error('Rate Limit Error (Fallback to Allow):', error);
        // Fail open strategy: If DB fails, allow traffic (don't block legitimate users because of infra issues)
        return {
            success: true,
            limit: options.limit,
            remaining: 1,
            reset: now + options.windowMs
        };
    }
}
