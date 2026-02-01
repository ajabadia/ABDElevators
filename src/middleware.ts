import { NextResponse, NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';

const { auth } = NextAuth(authConfig);

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|[\\w-]+\\.\\w+).*)',
    ],
};

/**
 * Middleware de Seguridad y Performance
 * Regla de Oro #8 (Performance) y #9 (Security)
 * optimized for Vercel Edge Runtime (No DB imports)
 */
export default auth(async function middleware(request: NextRequest) {
    try {
        const { pathname } = request.nextUrl;
        const session = (request as any).auth; // In the wrapper, session is available here

        // 🛡️ Rutas públicas
        const publicPaths = [
            '/',
            '/login',
            '/api/auth',
            '/api/webhooks',
            '/privacy',
            '/terms',
            '/arquitectura',
            '/features',
            '/upgrade',
            '/auth',
            '/api/health',
            '/api/debug',
            '/api/debug-auth',
            '/auth/signup-invite',
            '/error',
        ];

        // 🛡️ Fix 404 on Auth Error
        if (pathname === '/api/auth/error') {
            const error = request.nextUrl.searchParams.get('error');
            return NextResponse.redirect(new URL(`/auth/error?error=${error || 'Default'}`, request.url));
        }

        const isPublicPath = publicPaths.some(path => {
            if (path === '/') return pathname === '/';
            return pathname.startsWith(path);
        });

        // 🔄 Redirection if already logged in
        if (session && pathname === '/login') {
            const target = '/admin/knowledge-assets';
            return NextResponse.redirect(new URL(target, request.url));
        }

        // If not authenticated
        if (!session && !isPublicPath) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Role-based logic
        if (session && pathname.startsWith('/admin')) {
            const userRole = session.user?.role;
            const isEngineeringDocs = pathname.startsWith('/admin/knowledge-assets') && userRole === 'INGENIERIA';
            const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

            if (!isAdmin && !isEngineeringDocs) {
                return NextResponse.redirect(new URL('/entities', request.url));
            }
        }

        // Security Headers
        const response = NextResponse.next();
        response.headers.set('X-Edge-Middleware', 'true');

        // Basic Security Headers (Rule #9)
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');

        return response;

    } catch (error: any) {
        console.error('Middleware Critical Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error (Security Middleware)' },
            { status: 500 }
        );
    }
});
