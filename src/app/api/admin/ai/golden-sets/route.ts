import { NextResponse } from 'next/server';
import { RagGoldenSetService } from '@/services/admin/rag-golden-set-service';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { generateUUID } from '@/lib/utils';
import { RagGoldenSetSchema } from '@/lib/schemas';

/**
 * GET /api/admin/rag/golden-sets
 * Lists golden set entries for the current tenant.
 */
export async function GET(req: Request) {
    const correlationId = generateUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            throw new AppError('UNAUTHORIZED', 401, 'Tenant session missing');
        }

        const { searchParams } = new URL(req.url);
        const flowType = searchParams.get('flowType') || undefined;

        const entries = await RagGoldenSetService.listEntries(session.user.tenantId, flowType);

        const duration = Date.now() - start;
        await logEvento({
            level: 'INFO',
            source: 'API_GOLDEN_SETS',
            action: 'LIST_ENTRIES',
            message: `Listed ${entries.length} entries`,
            correlationId,
            tenantId: session.user.tenantId,
            userId: session.user.id,
            details: { count: entries.length, duration_ms: duration }
        });

        return NextResponse.json({ success: true, data: entries });

    } catch (error: unknown) {
        console.error('[API_GOLDEN_SETS] GET Error:', error);
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, code: error.code, message: error.message }, { status: error.status });
        }
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/rag/golden-sets
 * Creates a new golden set entry.
 */
export async function POST(req: Request) {
    const correlationId = generateUUID();
    const start = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            throw new AppError('UNAUTHORIZED', 401, 'Tenant session missing');
        }

        const body = await req.json();
        const entryId = await RagGoldenSetService.addEntry(body, session.user.tenantId, session.user.email || 'unknown');

        const duration = Date.now() - start;
        await logEvento({
            level: 'INFO',
            source: 'API_GOLDEN_SETS',
            action: 'CREATE_ENTRY',
            message: `Created entry ${entryId}`,
            correlationId,
            tenantId: session.user.tenantId,
            userId: session.user.id,
            details: { entryId, duration_ms: duration }
        });

        return NextResponse.json({ success: true, data: { id: entryId } });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, code: 'VALIDATION_ERROR', details: error.format() }, { status: 400 });
        }
        console.error('[API_GOLDEN_SETS] POST Error:', error);
        if (error instanceof AppError) {
            return NextResponse.json({ success: false, code: error.code, message: error.message }, { status: error.status });
        }
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
