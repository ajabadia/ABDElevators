import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await auth();
    const cookies = req.cookies.getAll();
    const headers = Object.fromEntries(req.headers.entries());

    return NextResponse.json({
        message: "Debug Auth Endpoint",
        env: process.env.NODE_ENV,
        session,
        cookies,
        headers: {
            host: headers.host,
            'x-forwarded-proto': headers['x-forwarded-proto'],
            'cookie': headers.cookie,
        }
    });
}
