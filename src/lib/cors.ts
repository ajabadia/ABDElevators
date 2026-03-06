/**
 * CORS Helper Utility
 * Centralizes origin validation for the platform.
 */

const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://abdelevators.vercel.app',
    'https://www.abdelevators.com'
];

/**
 * Validates if an origin is permitted based on environment configuration.
 */
export function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return false;

    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : DEFAULT_ALLOWED_ORIGINS;

    return allowedOrigins.includes(origin);
}

/**
 * Common CORS headers for successful responses.
 */
export function getCorsHeaders(origin: string) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-internal-secret, x-correlation-id',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };
}
