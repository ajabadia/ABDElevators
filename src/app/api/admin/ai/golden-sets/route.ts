import { NextResponse } from 'next/server';
import { RagGoldenSetService } from '@/services/admin/rag-golden-set-service';
import { handleApiError, AppError } from '@/lib/errors';
import { z } from 'zod';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { auth } from '@/lib/auth';

/**
 * GET /api/admin/golden-sets
 * Lists golden set entries for the current tenant.
 */
async function GET_internal(req: Request) {
    return withCorrelation(
        { level: 'INFO', source: 'API_GOLDEN_SETS', action: 'LIST' },
        async ({ log, correlationId }) => {
            try {
                const session = await auth();
                if (!session?.user?.tenantId) {
                    throw new AppError('UNAUTHORIZED', 401, 'Tenant session missing');
                }

                const { searchParams } = new URL(req.url);
                const flowType = searchParams.get('flowType') || undefined;

                const entries = await RagGoldenSetService.listEntries(session.user.tenantId, flowType);

                await log({
                    message: `Successfully retrieved ${entries.length} golden set entries`,
                    details: { count: entries.length, flowType }
                });

                return NextResponse.json({ success: true, data: entries });

            } catch (error: unknown) {
                return handleApiError(error, 'API_GOLDEN_SETS_GET', correlationId);
            }
        }
    );
}

/**
 * POST /api/admin/golden-sets
 * Creates a new golden set entry.
 */
async function POST_internal(req: Request) {
    return withCorrelation(
        { level: 'INFO', source: 'API_GOLDEN_SETS', action: 'CREATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await auth();
                if (!session?.user?.tenantId) {
                    throw new AppError('UNAUTHORIZED', 401, 'Tenant session missing');
                }

                const body = await req.json();
                const entryId = await RagGoldenSetService.addEntry(body, session.user.tenantId, session.user.email || 'unknown');

                await log({
                    message: `Created golden set entry ${entryId} for tenant ${session.user.tenantId}`,
                    details: { entryId, createdBy: session.user.email }
                });

                return NextResponse.json({ success: true, data: { id: entryId } });

            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    return handleApiError(error, 'API_GOLDEN_SETS_VAL', correlationId);
                }
                return handleApiError(error, 'API_GOLDEN_SETS_POST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/ai/golden-sets', thresholdMs: 1000 });

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/admin/ai/golden-sets', thresholdMs: 1000 });
