import { handlers } from "@/lib/auth";

/**
 * Endpoint de NextAuth v5 (Beta).
 * El rate limiting se gestiona de forma centralizada en middleware.ts para evitar 
 * doble procesamiento del stream y latencias innecesarias.
 */
export const { GET, POST } = handlers;
export const runtime = 'nodejs';
