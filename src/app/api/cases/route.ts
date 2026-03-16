import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getCaseCollection } from '@/lib/db-tenant';
import { GenericCaseSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal() {
    return withCorrelation(
        { level: 'INFO', source: 'API_CASOS', action: 'LIST' },
        async ({ correlationId, log }) => {
            try {
                const session = await requirePermission('technical:analysis', 'read');
                const collection = await getCaseCollection(session.user as any);
                const casos = await collection.find({}, { sort: { actualizado: -1 } });
                
                await log({ 
                    message: `Retrieved ${casos.length} cases`, 
                    details: { count: casos.length },
                    tenantId: session.user.tenantId
                });

                return NextResponse.json({ success: true, casos });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CASOS_GET', correlationId);
            }
        }
    );
}

async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_CASOS', action: 'CREATE' },
        async ({ correlationId, log }) => {
            try {
                const session = await requirePermission('technical:analysis', 'write');
                const body = await req.json();
                const collection = await getCaseCollection(session.user as any);
                const validated = GenericCaseSchema.parse(body);
                const result = await collection.insertOne(validated as any);

                await log({
                    level: 'INFO', 
                    action: 'CREATE_CASE',
                    message: `Nuevo caso creado: ${result.insertedId}`,
                    details: { 
                        industry: validated.industry,
                        caseId: result.insertedId.toString()
                    },
                    tenantId: session.user.tenantId
                });

                return NextResponse.json({ success: true, case_id: result.insertedId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_CASOS_POST', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/cases', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/cases', thresholdMs: 1000 });
