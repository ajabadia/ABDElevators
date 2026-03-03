import { handlers } from "@/lib/auth";
import { withPerformanceSLA } from "@/lib/interceptors/performance-interceptor";

/**
 * Endpoint de NextAuth v5 (Beta).
 * El rate limiting se gestiona de forma centralizada en middleware.ts para evitar 
 * doble procesamiento del stream y latencias innecesarias.
 * WRAPPED with Performance SLA for monitoring (ERA 9).
 */
export const GET = withPerformanceSLA(handlers.GET, { endpoint: 'GET /api/auth/[...nextauth]', thresholdMs: 500 });
export const POST = withPerformanceSLA(handlers.POST, { endpoint: 'POST /api/auth/[...nextauth]', thresholdMs: 2000 });

export const runtime = 'nodejs';
