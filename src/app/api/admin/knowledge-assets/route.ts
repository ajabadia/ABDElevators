import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { AppPermission } from '@/types/permissions';
import { z } from 'zod';
import crypto from 'crypto';

const QuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    skip: z.coerce.number().min(0).default(0),
    search: z.string().optional()
});

/**
 * List Knowledge Assets
 * SLA: P95 < 500ms
 */
export async function GET(req: NextRequest) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        // 1. Enforce specific permission (instead of role-based check)
        const user = await enforcePermission('knowledge', 'read');

        // 2. Validate inputs
        const { searchParams } = new URL(req.url);
        const { limit, skip, search } = QuerySchema.parse(Object.fromEntries(searchParams));

        // 3. SECURE COLLECTION: Multi-tenant Isolation
        const { auth } = await import('@/lib/auth');
        // Rule #11 Secure Multi-tenant
        const session = await auth();
        const collection = await getTenantCollection('knowledge_assets', session);

        // 4. Build filter
        const filter: any = {};
        if (search) {
            filter.$or = [
                { filename: { $regex: search, $options: 'i' } },
                { componentType: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const [assets, total] = await Promise.all([
            collection.find(filter, {
                sort: { createdAt: -1 } as any,
                skip,
                limit
            }),
            collection.countDocuments(filter)
        ]);

        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_KNOWLEDGE_ASSETS',
                action: 'LIST_ASSETS_SLOW',
                message: `Slow query detected: ${duration}ms`,
                correlationId,
                details: { duration, tenantId: user.tenantId }
            });
        }

        return NextResponse.json({
            success: true,
            assets,
            pagination: { total, limit, skip }
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                code: 'VALIDATION_ERROR',
                message: 'Parámetros de consulta inválidos',
                details: error.issues
            }, { status: 400 });
        }
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, code: error.code, message: error.message }, { status: error.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_KNOWLEDGE_ASSETS',
            action: 'LIST_ASSETS_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error listing assets').toJSON(),
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 500) {
            await logEvento({
                level: 'WARN',
                source: 'API_ASSETS_LIST',
                action: 'SLA_VIOLATION',
                message: `Asset list slow: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}
