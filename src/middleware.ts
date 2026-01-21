import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de Seguridad y Performance
 * Regla de Oro #8 (Performance) y #9 (Security)
 */
export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const start = Date.now();

    // 1. Añadir Security Headers (Regla #9)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // CORS simplificado para entorno corporativo (Whitelist en .env en el futuro)
    // response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');

    // 2. Monitoreo de Performance (Regla #8)
    // Nota: En Edge middleware, el tiempo real de respuesta se mide en el cliente o logs de Vercel,
    // pero aquí podemos interceptar el fin de la ejecución del middleware.

    return response;
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
