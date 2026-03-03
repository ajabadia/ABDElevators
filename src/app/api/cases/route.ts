import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getCaseCollection } from '@/lib/db-tenant';
import { GenericCaseSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { enforcePermission } from '@/lib/guardian-guard';

async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('technical:analysis', 'read');
        const collection = await getCaseCollection(session.user as any);
        const casos = await collection.find({}, { sort: { actualizado: -1 } });
        return NextResponse.json({ success: true, casos });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CASOS_GET', correlationId);
    }
}

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('technical:analysis', 'write');
        const body = await req.json();
        const collection = await getCaseCollection(session.user as any);
        const validated = GenericCaseSchema.parse(body);
        const result = await collection.insertOne(validated);

        await logEvento({
            level: 'INFO', source: 'API_CASOS', action: 'CREATE_CASE',
            message: `Nuevo caso: ${result.insertedId}`, correlationId,
            details: { industry: validated.industry }
        });

        return NextResponse.json({ success: true, case_id: result.insertedId });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CASOS_POST', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/cases', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/cases', thresholdMs: 1000 });
