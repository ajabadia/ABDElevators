import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Auth API directory is accessible',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
}
