export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import { auth } from './lib/auth';

/**
 * Middleware de Seguridad y Performance
 * Regla de Oro #8 (Performance) y #9 (Security)
 */
export async function middleware(request: NextRequest) {
    const session = await auth();
    const { pathname } = request.nextUrl;

    // Rutas públicas
    const publicPaths = ['/', '/login', '/api/auth'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    // Si no está autenticado y intenta acceder a ruta protegida
    if (!session && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Control de acceso basado en roles
    if (session) {
        const userRole = session.user?.role;

        // Solo ADMIN puede acceder a /admin
        if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/pedidos', request.url));
        }

        // INGENIERIA solo puede ver documentos (read-only)
        if (pathname.startsWith('/admin/documentos') && userRole === 'INGENIERIA') {
            // Permitir solo GET requests
            if (request.method !== 'GET') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }
    }

    const response = NextResponse.next();
    const start = Date.now();

    // Security Headers (Regla #9)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
