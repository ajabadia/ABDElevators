import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';

/**
 * GET /api/admin/debug/migrate-status
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'DEBUG_MIGRATION', action: 'ZERO_SPANISH_MIGRATION' },
        async ({ log, correlationId }) => {
            try {
                // await requirePermission('platform:admin', 'manage');
                
                await log({ message: '🚀 API-Based Migration: Starting Zero Spanish Migration...' });
                const db = await connectDB();
                const collection = db.collection('knowledge_assets');

                const mappings = [
                    { from: 'vigente', to: 'ACTIVE' },
                    { from: 'obsoleto', to: 'ARCHIVED' },
                    { from: 'borrador', to: 'DRAFT' },
                    { from: 'pendiente', to: 'pending' },
                    { from: 'revisado', to: 'reviewed' },
                    { from: 'pospuesto', to: 'snoozed' },
                    { from: 'expirado', to: 'expired' }
                ];

                let totalModified = 0;
                const results: any[] = [];

                for (const mapping of mappings) {
                    const statusResult = await collection.updateMany(
                        { status: mapping.from } as any,
                        { $set: { status: mapping.to } } as any
                    );
                    if (statusResult.modifiedCount > 0) {
                        results.push({ field: 'status', from: mapping.from, to: mapping.to, count: statusResult.modifiedCount });
                        totalModified += statusResult.modifiedCount;
                    }

                    const reviewResult = await collection.updateMany(
                        { reviewStatus: mapping.from } as any,
                        { $set: { reviewStatus: mapping.to } } as any
                    );
                    if (reviewResult.modifiedCount > 0) {
                        results.push({ field: 'reviewStatus', from: mapping.from, to: mapping.to, count: reviewResult.modifiedCount });
                        totalModified += reviewResult.modifiedCount;
                    }
                }

                await log({
                    message: `Migration completed via API. Modified ${totalModified} operations.`,
                    details: { modifiedCount: totalModified, results }
                });

                return NextResponse.json({ 
                    success: true, 
                    totalModified, 
                    details: results,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'DEBUG_MIGRATION_API', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/debug/migrate-status', thresholdMs: 5000 });
