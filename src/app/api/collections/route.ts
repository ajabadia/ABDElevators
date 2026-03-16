import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { CollectionService } from '@/services/core/collection-service';
import { CreateCollectionSchema } from '@/lib/schemas/collections';
import { AppError, handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * 📚 User Collections API
 * GET: List user collections
 * POST: Create a new collection (Notebook)
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_COLLECTIONS', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge', 'read');
                const tenantId = session.user.tenantId;

                await log({
                    message: 'Fetching user collections',
                    tenantId
                });

                const collections = await CollectionService.getUserCollections(
                    tenantId,
                    session.user.id,
                    session
                );

                await log({
                    message: `Retrieved ${collections.length} collections`,
                    tenantId
                });

                return NextResponse.json({ 
                    success: true, 
                    items: collections,
                    correlationId 
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_COLLECTIONS_GET', correlationId);
            }
        }
    );
}

async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_COLLECTIONS', action: 'CREATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge', 'manage_collections');

                // Rate limiting
                const { success } = await checkRateLimit(session.user.id, LIMITS.CORE);
                if (!success) {
                    throw new AppError('FORBIDDEN', 429, 'Demasiadas solicitudes.');
                }

                const body = await req.json();
                const validated = CreateCollectionSchema.parse(body);

                const tenantId = session.user.tenantId;

                await log({
                    message: `Creating new collection: ${validated.name}`,
                    tenantId
                });

                const collectionId = await CollectionService.createCollection(
                    tenantId,
                    session.user.id,
                    validated,
                    session
                );

                await log({
                    message: `Collection created: ${collectionId}`,
                    details: { collectionId },
                    tenantId
                });

                return NextResponse.json({ 
                    success: true, 
                    collectionId,
                    correlationId 
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_COLLECTIONS_POST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/collections', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/collections', thresholdMs: 1000 });
