import { NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Hardening (Phase 105): Restrict debug tools in production and remove hardcoded secrets
        const debugToken = process.env.HEALTH_CHECK_SECRET;

        if (!debugToken || secret !== debugToken || process.env.NODE_ENV === 'production') {
            const { logEvento } = await import('@/lib/logger');
            await logEvento({
                level: 'WARN',
                source: 'SECURITY_HARDENING',
                action: 'UNAUTHORIZED_HEALTH_CHECK',
                message: `Intento de acceso a health check denegado (ENV: ${process.env.NODE_ENV})`,
                correlationId: 'security-event'
            });
            return NextResponse.json({ error: 'Access restricted. Diagnostic tools are disabled in this environment or missing secure token.' }, { status: 403 });
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
            envNextAuthUrl: process.env.NEXTAUTH_URL || 'N/A',
            hasAuthSecret: !!process.env.AUTH_SECRET,
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            nodeEnv: process.env.NODE_ENV,
            // 4. Verify Password Integrity (admin@abd.com / super123)
            passwordCheck: user ? await require('bcryptjs').compare('super123', user.password) : 'UserNotFound'
        });

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
