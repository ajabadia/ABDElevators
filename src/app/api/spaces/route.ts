import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SpaceService } from '@/services/tenant/space-service';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { enforcePermission } from '@/lib/guardian-guard';
import crypto from 'crypto';
import { z } from 'zod';

const QuerySchema = z.object({
    industry: z.string().optional(),
    isRoot: z.string().optional(),
    parentSpaceId: z.string().optional(),
    search: z.string().optional()
});

/**
 * [PHASE 125.2] Get Accessible Spaces for current user
 * SLA: P95 < 300ms
 */
export async function GET(req: NextRequest) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        const { searchParams } = new URL(req.url);
        const params = QuerySchema.parse(Object.fromEntries(searchParams));

        const user = await enforcePermission('knowledge', 'read');
        const session = await auth();

        if (!session?.user?.id) {
            throw new AppError('UNAUTHORIZED', 401, 'Session required');
        }

        const items = await SpaceService.getAccessibleSpaces(
            session.user.tenantId,
            session.user.id,
            {
                industry: params.industry,
                isRoot: params.isRoot === 'true',
                parentSpaceId: params.parentSpaceId,
                search: params.search
            },
            session
        );

        return NextResponse.json({
            success: true,
            items
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Invalid parameters',
                details: error.issues
            }, { status: 400 });
        }

        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_SPACES',
            action: 'GET_ACCESSIBLE_SPACES_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error retrieving spaces' }
        }, { status: 500 });
    } finally {
        const duration = Date.now() - start;
        if (duration > 300) {
            await logEvento({
                level: 'WARN',
                source: 'API_SPACES',
                action: 'SLA_VIOLATION',
                message: `Get accessible spaces slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
