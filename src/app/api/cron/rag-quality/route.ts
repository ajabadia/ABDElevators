import { NextResponse } from 'next/server';
import { RAGQualityService } from '@/lib/services/RAGQualityService';
import { logEvento } from '@/lib/logger';
import { getTenantCollection } from '@/lib/db-tenant';

/**
 * ⏰ CRON: RAG Quality Evaluation
 * Ejecuta evaluaciones batch para todos los tenants activos.
 * SLA: P95 < 2000ms (Batch dependiente)
 */
export async function GET(request: Request) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        // En una implementación real, iteraríamos sobre tenants activos.
        // Aquí simulamos el proceso para el tenant platform_master o dinámicamente.
        const tenantsCollection = await getTenantCollection('tenants' as any, { user: { id: 'system', tenantId: 'platform_master', role: 'SUPER_ADMIN' } } as any, 'AUTH');
        const tenants = await tenantsCollection.find({ active: true } as any);

        const results = [];

        for (const tenant of tenants) {
            const res = await RAGQualityService.runBatchEvaluation(tenant._id.toString());
            results.push({ tenantId: tenant._id, ...res });
        }

        const duration = Date.now() - start;
        await logEvento({
            level: 'INFO',
            source: 'CRON_RAG_QUALITY',
            action: 'BATCH_EVALUATION',
            message: `Evaluación batch completada para ${tenants.length} tenants`,
            correlationId,
            details: { durationMs: duration, results }
        });

        return NextResponse.json({ success: true, results, durationMs: duration });
    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'CRON_RAG_QUALITY',
            action: 'BATCH_ERROR',
            message: error.message,
            correlationId,
            details: { stack: error.stack }
        });
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
