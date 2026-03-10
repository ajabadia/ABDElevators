import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, AppError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { ObjectId } from 'mongodb';
import { technicalEntityRepository } from '@/lib/repositories/TechnicalEntityRepository';

/**
 * GET /api/core/entities/[type]/[id]
 * Get a single entity by type and ID.
 */
export const GET = withPerformanceSLA(async (req: NextRequest, context: { params: Promise<{ type: string, id: string }> }) => {
    const correlationId = crypto.randomUUID();

    const rawParams = await context.params;
    const { id } = rawParams;

    try {
        const session = await requirePermission('entities', 'read');

        if (!ObjectId.isValid(id)) {
            throw new AppError('VALIDATION_ERROR', 400, 'Invalid entity ID format');
        }

        const entity = await technicalEntityRepository.getEntity(id, session as any);

        return NextResponse.json({
            success: true,
            entity,
            correlationId
        });

    } catch (error: unknown) {
        return handleApiError(error, 'API_CORE_ENTITIES_GET', correlationId);
    }
}, { endpoint: 'GET /api/core/entities/[type]/[id]', thresholdMs: 500 });
