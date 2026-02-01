
import { NextResponse } from 'next/server';
import { IntelligenceAnalyticsService } from '@/lib/intelligence-analytics';
import { auth } from '@/lib/auth'; // Using your auth wrapper
import { logEvento } from '@/lib/logger';

export async function GET() {
    try {
        const session = await auth();
        // Strict Role Check: Only SUPER_ADMIN or ADMIN should see this
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const stats = await IntelligenceAnalyticsService.getStats();

        // Optional log for viewing dashboard (can be noisy, maybe remove if too frequent)
        // await logEvento({ ... });

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[API INTELLIGENCE STATS]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
