import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Quick check to ensure DB is responsive
        const db = await connectDB();
        await db.command({ ping: 1 });

        return NextResponse.json(
            { status: 'ready', db: 'connected', timestamp: new Date().toISOString() },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Readiness Check Failed:', error);
        return NextResponse.json(
            { status: 'not_ready', error: error.message },
            { status: 503 }
        );
    }
}
