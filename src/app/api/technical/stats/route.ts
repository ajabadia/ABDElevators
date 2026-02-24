import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TechnicalStatsService } from '@/services/core/TechnicalStatsService';
import { AppError, handleApiError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/technical/stats
 * Provides technical KPIs for the infrastructure dashboard.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const stats = await TechnicalStatsService.getTechnicalKPIs(session.user.tenantId);

        return NextResponse.json({
            success: true,
            stats
        });

    } catch (error) {
        return handleApiError(error, 'API_TECHNICAL_STATS', correlationId);
    }
}
