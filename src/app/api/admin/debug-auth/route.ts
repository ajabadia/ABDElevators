
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';

export async function GET() {
    try {
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
        return NextResponse.json({
            success: true,
            message: "Auth working correctly",
            session: {
                user: {
                    email: session.user.email,
                    role: session.user.role,
                    tenantId: session.user.tenantId
                }
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            code: error.code || 'UNKNOWN'
        }, { status: 500 });
    }
}
