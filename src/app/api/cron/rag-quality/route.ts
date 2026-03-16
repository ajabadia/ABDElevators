import { NextResponse } from 'next/server';
import { RAGQualityService } from '@/lib/services/RAGQualityService';
import { getTenantCollection } from '@/lib/db-tenant';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { getSystemSession } from '@/lib/sessions/system-session';

/**
 * ⏰ CRON: RAG Quality Evaluation
 * Ejecuta evaluaciones batch para todos los tenants activos.
 * SLA: P95 < 2000ms (Batch dependiente)
 */
export async function GET(request: Request) {
    const start = Date.now();

    return await withCorrelation(
        { level: 'INFO', source: 'CRON_RAG_QUALITY', action: 'BATCH_EVALUATION' },
        async ({ log, correlationId }) => {
            try {
                // Iterar sobre todos los tenants activos.
                const systemSession = getSystemSession('platform_master');
                const tenantsCollection = await getTenantCollection('tenants' as any, systemSession as any, 'AUTH');
                const tenants = await (tenantsCollection.find({ active: true } as any) as any).toArray();

                const results = [];

                for (const tenant of tenants) {
                    const res = await RAGQualityService.runBatchEvaluation(tenant._id.toString());
                    results.push({ tenantId: tenant._id, ...res });
                }

                const durationMs = Date.now() - start;
                await log({
                    message: `Evaluación batch completada para ${tenants.length} tenants`,
                    details: { durationMs, results }
                });

                return NextResponse.json({ success: true, results, durationMs });
            } catch (error: any) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                await log({
                    level: 'ERROR',
                    action: 'BATCH_ERROR',
                    message: errorMessage,
                    details: { stack: error.stack }
                });
                return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
            }
        }
    );
}
