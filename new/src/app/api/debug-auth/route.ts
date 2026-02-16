import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';
import * as AuthModule from '@/lib/auth';
import NextAuth from 'next-auth';

// Force Node.js runtime to match the Auth API
export const runtime = 'nodejs';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);

        const envCheck = {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL,
            AUTH_URL: process.env.AUTH_URL || 'UNDEFINED',
            VERCEL_URL: process.env.VERCEL_URL || 'UNDEFINED',
            AUTH_SECRET: process.env.AUTH_SECRET ? 'DEFINED (' + process.env.AUTH_SECRET.length + ' chars)' : 'MISSING',
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'DEFINED' : 'MISSING',
            NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'DEFINED' : 'MISSING',
            AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
        };

        // Try to check if handlers are exported
        const moduleCheck = {
            hasHandlers: !!AuthModule.handlers,
            hasAuth: !!AuthModule.auth,
            hasSignIn: !!AuthModule.signIn,
            keys: Object.keys(AuthModule)
        };

        let authStatus = "Unknown";
        try {
            const { auth } = NextAuth(authConfig);
            authStatus = "Auth object created successfully";
        } catch (e: any) {
            authStatus = "Auth creation failed: " + e.message;
        }

        return NextResponse.json({
            status: 'diagnostic_complete',
            timestamp: new Date().toISOString(),
            requestUrl: request.url,
            runtime: process.version,
            env: envCheck,
            module: moduleCheck,
            authInit: authStatus,
            tip: "If you see a 404 on /api/auth/providers but NOT here, verify that 'basePath' matches your folder structure."
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
