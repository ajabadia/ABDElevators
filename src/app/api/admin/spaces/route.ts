import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { SpaceService } from '@/services/tenant/space-service';
import { SpaceSchema, Space } from '@/lib/schemas/spaces';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import crypto from 'crypto';

const AdminQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    skip: z.coerce.number().min(0).default(0),
    search: z.string().optional()
});

/**
 * [PHASE 125.2] List Spaces (Admin Context)
 * SLA: P95 < 500ms
 */
export async function GET(req: NextRequest) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('knowledge', 'read');
        const { searchParams } = new URL(req.url);
        const { limit, skip, search } = AdminQuerySchema.parse(Object.fromEntries(searchParams));

        const collection = await getTenantCollection<Space>('spaces', session);

        const filter: any = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const [items, total] = await Promise.all([
            collection.find(filter, {
                sort: { createdAt: -1 } as any,
                skip,
                limit
            }),
            collection.countDocuments(filter)
        ]);

        return NextResponse.json({
            success: true,
            items,
            pagination: { total, limit, skip }
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Invalid query parameters',
                details: error.issues
            }, { status: 400 });
        }

        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_ADMIN_SPACES',
            action: 'LIST_SPACES_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error listing spaces' }
        }, { status: 500 });
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_ADMIN_SPACES',
                action: 'SLA_VIOLATION',
                message: `List spaces slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

/**
 * [PHASE 125.2] Create Space
 * SLA: P95 < 500ms
 */
export async function POST(req: NextRequest) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('knowledge', 'manage_spaces');

        // Rate limiting
        const { success } = await checkRateLimit(session.user.id, LIMITS.ADMIN);
        if (!success) {
            throw new AppError('FORBIDDEN', 429, 'Too many requests. Please slow down.');
        }

        const body = await req.json();

        // Zod validation BEFORE processing
        const validatedData = SpaceSchema.omit({ _id: true, createdAt: true, updatedAt: true }).parse(body);

        const spaceId = await SpaceService.createSpace(
            session.user.tenantId,
            session.user.id,
            validatedData,
            session
        );

        return NextResponse.json({
            success: true,
            spaceId
        }, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Invalid space data',
                details: error.issues
            }, { status: 400 });
        }

        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_ADMIN_SPACES',
            action: 'CREATE_SPACE_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Error creating space' }
        }, { status: 500 });
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_ADMIN_SPACES',
                action: 'SLA_VIOLATION_POST',
                message: `Create space slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
