import { NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Simple guard to prevent public abuse, checking for a simple hardcoded 'debug' token
        // User triggers via: /api/health/db-check?secret=elevator-debug
        if (secret !== 'elevator-debug') {
            return NextResponse.json({ error: 'Unauthorized debug access' }, { status: 403 });
        }

        const db = await connectAuthDB();
        const dbName = db.databaseName;

        // 1. Check User
        const user = await db.collection('users').findOne({ email: 'admin@abd.com' });

        // 2. Get minimal stats
        const userCount = await db.collection('users').countDocuments();

        // 3. Get first 2 users to inspect keys (without values for privacy)
        const sampleUsers = await db.collection('users').find({}).limit(2).toArray();
        const schemas = sampleUsers.map(u => Object.keys(u));

        return NextResponse.json({
            status: 'ok',
            connectedDB: dbName,
            userCount,
            adminUserFound: !!user,
            adminUserRoleRaw: user ? (user.role || user.rol) : 'N/A',
            adminUserKeys: user ? Object.keys(user) : [],
            sampleSchemas: schemas,
            deployTimestamp: new Date().toISOString(),
            envAuthUrl: process.env.AUTH_URL || 'N/A',
            envNextAuthUrl: process.env.NEXTAUTH_URL || 'N/A'
        });

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
