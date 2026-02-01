import { NextResponse, NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';

const { auth } = NextAuth(authConfig);

export const config = {
    // Only protect admin routes, let everything else pass
    matcher: ["/admin/:path*", "/login"],
};

export default auth(async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = (request as any).auth;

    console.log(`🛡️ [MIDDLEWARE] Path: ${pathname}, Session: ${!!session}`);

    // Redirect to dashboard if logged in and trying to access login page
    if (session && pathname === '/login') {
        return NextResponse.redirect(new URL('/admin/knowledge-assets', request.url));
    }

    // Protect admin routes
    if (!session && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
});
