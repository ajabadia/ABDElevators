import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
    const session = await auth();
    return NextResponse.json({
        tenantId: session?.user?.tenantId,
        user: session?.user?.email,
        rawSession: session
    });
}
