import crypto from 'crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AppError, handleApiError } from '@/lib/errors';
import { UserRole } from '@/types/roles';
import { AnomalyDetectionService } from '@/services/ops/AnomalyDetectionService';

/**
 * 🛰️ Global Anomalies API (Phase 160.3)
 * Provides SuperAdmins with real-time anomaly detection results.
 */
async function GET_internal (req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();

        if (session?.user?.role !== UserRole.SUPER_ADMIN) {
            throw new AppError('FORBIDDEN', 403, 'Acceso restringido a SuperAdmins');
        }

        // Run detection in parallel
        const [latencyAnomalies, errorAnomalies] = await Promise.all([
            AnomalyDetectionService.detectLatencyAnomalies(),
            AnomalyDetectionService.detectErrorAnomalies()
        ]);

        return NextResponse.json({
            success: true,
            anomalies: {
                latency: latencyAnomalies,
                errors: errorAnomalies,
                total: latencyAnomalies.length + errorAnomalies.length
            },
            timestamp: new Date(),
            correlationId
        });

    } catch (error: any) {
        return handleApiError(error, 'API_SUPERADMIN_ANOMALIES', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/superadmin/anomalies', thresholdMs: 1000 });
