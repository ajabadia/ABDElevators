export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import { auth } from './lib/auth';
import { logEvento } from './lib/logger';

/**
 * Middleware de Seguridad y Performance
 * Regla de Oro #8 (Performance) y #9 (Security)
 */
export async function middleware(request: NextRequest) {
    const session = await auth();
    const { pathname } = request.nextUrl;

    // Log para debug de sesión (Regla #4)
    if (pathname.startsWith('/admin') || pathname.startsWith('/pedidos')) {
        const correlacion_id = crypto.randomUUID();
        await logEvento({
            nivel: 'DEBUG',
            origen: 'MIDDLEWARE',
            accion: 'SESSION_CHECK',
            mensaje: `Pattern: ${pathname} | Session: ${session ? 'YES' : 'NO'} | Role: ${session?.user?.role || 'NONE'}`,
            correlacion_id,
            detalles: { pathname, has_session: !!session, role: session?.user?.role }
        });
    }

    // Rutas públicas
    const publicPaths = ['/login', '/api/auth'];
    const isPublicPath = pathname === '/' || publicPaths.some(path => pathname.startsWith(path));

    // Si no está autenticado y intenta acceder a ruta protegida
    if (!session && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Control de acceso basado en roles
    if (session) {
        const userRole = session.user?.role;

        // Rutas compartidas por todos los autenticados: /perfil, /mis-documentos

        // ADMIN: Acceso total a /admin
        if (pathname.startsWith('/admin') && userRole !== 'ADMIN' && userRole !== 'INGENIERIA') {
            // Si es INGENIERIA puede entrar a /admin/documentos (read-only)
            if (!(pathname.startsWith('/admin/documentos') && userRole === 'INGENIERIA')) {
                return NextResponse.redirect(new URL('/pedidos', request.url));
            }
        }

        // TECNICO: Solo puede entrar a /pedidos y las comunes
        if (pathname.startsWith('/admin') && userRole === 'TECNICO') {
            return NextResponse.redirect(new URL('/pedidos', request.url));
        }

        // Solo ADMIN y TECNICO pueden acceder a /pedidos
        if (pathname.startsWith('/pedidos') && userRole === 'INGENIERIA') {
            return NextResponse.redirect(new URL('/admin/documentos', request.url));
        }

        // Restricción específica para INGENIERIA en Documentos (read-only)
        if (pathname.startsWith('/admin/documentos') && userRole === 'INGENIERIA') {
            if (request.method !== 'GET') {
                return NextResponse.json({ error: 'Acceso de solo lectura para Ingeniería' }, { status: 403 });
            }
        }
    }

    const response = NextResponse.next();

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
