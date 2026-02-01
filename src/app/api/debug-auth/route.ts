import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';
import NextAuth from 'next-auth';

// Force Node.js runtime to match the Auth API
export const runtime = 'nodejs';

export async function GET(request: Request) {
    try {
        const envCheck = {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL,
            AUTH_URL: process.env.AUTH_URL ? 'DEFINED' : 'MISSING',
            AUTH_SECRET: process.env.AUTH_SECRET ? 'DEFINED (Length: ' + process.env.AUTH_SECRET.length + ')' : 'MISSING',
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'DEFINED' : 'MISSING',
            NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'DEFINED' : 'MISSING',
            MONGODB_URI: process.env.MONGODB_URI ? 'DEFINED' : 'MISSING',
        };

        // Try to initialize Auth manually to see if it crashes
        let authStatus = "Unknown";
        try {
            const { auth } = NextAuth(authConfig);
            authStatus = "Initialized Success";
        } catch (e: any) {
            authStatus = "Initialization Failed: " + e.message;
        }

        return NextResponse.json({
            status: 'alive',
            runtime: process.version,
            env: envCheck,
            authInit: authStatus,
            message: 'If you see this, the API routing is working.'
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'crashed',
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
