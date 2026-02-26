import { NextResponse } from 'next/server';
import { connectAuthDB } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // 🛡️ [SECURITY] Require SUPER_ADMIN role for diagnostic tools (Phase 232)
        try {
            await requireRole([UserRole.SUPER_ADMIN]);
        } catch (error) {
            return NextResponse.json({ error: 'Access restricted to SUPER_ADMIN.' }, { status: 403 });
        }

        // Hardening (Phase 105): Restrict debug tools in production and remove hardcoded secrets
        const debugToken = process.env.HEALTH_CHECK_SECRET;

        // If secret is provided, it must match debugToken. 
        // Note: Even with secret, requireRole above ensures only SUPER_ADMIN can reach this.
        if (secret && (!debugToken || secret !== debugToken)) {
            const { logEvento } = await import('@/lib/logger');
            await logEvento({
                level: 'WARN',
                source: 'SECURITY_HARDENING',
                action: 'INVALID_SECRET_HEALTH_CHECK',
                message: `Intento de acceso a health check con secreto inválido (ENV: ${process.env.NODE_ENV})`,
                correlationId: 'security-event'
            });
            return NextResponse.json({ error: 'Invalid secure token.' }, { status: 403 });
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
