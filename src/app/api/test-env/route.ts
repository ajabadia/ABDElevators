import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        SINGLE_TENANT_ID: process.env.SINGLE_TENANT_ID,
        MONGODB_URI: process.env.MONGODB_URI ? 'PRESENT' : 'MISSING',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'PRESENT' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV
    });
}
