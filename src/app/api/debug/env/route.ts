import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        NODE_ENV: process.env.NODE_ENV,
        SINGLE_TENANT_ID: process.env.SINGLE_TENANT_ID || 'MISSING',
        MONGODB_URI_SET: !!process.env.MONGODB_URI,
        GEMINI_API_KEY_SET: !!process.env.GEMINI_API_KEY,
        CWD: process.cwd(),
        TIMESTAMP: new Date().toISOString()
    });
}
