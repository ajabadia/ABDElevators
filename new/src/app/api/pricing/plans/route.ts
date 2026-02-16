import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';

/**
 * GET /api/pricing/plans
 * Sirve los planes de precios públicos para la landing page.
 * SLA: < 100ms (P95)
 */
export async function GET() {
    const correlacion_id = crypto.randomUUID();

    try {
        const db = await connectDB();

        // Obtener solo los planes marcados como públicos, ordenados por precio o importancia
        const plans = await db.collection('pricing_plans')
            .find({ isPublic: true })
            .sort({ priceMonthly: 1 })
            .toArray();

        return NextResponse.json({
            success: true,
            plans: plans.map(plan => ({
                id: plan._id,
                name: plan.name,
                slug: plan.slug,
                description: plan.description,
                features: plan.features,
                popular: plan.popular,
                priceMonthly: plan.priceMonthly,
                // Solo enviamos un resumen de las métricas para no exponer lógica interna compleja en la landing
                metricsSummary: Object.entries(plan.metrics || {}).map(([key, val]: [string, any]) => ({
                    metric: key,
                    type: val.type,
                    included: val.includedUnits || 0,
                    unitPrice: val.unitPrice || val.overagePrice || 0
                }))
            }))
        });

    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'API_PRICING',
            action: 'FETCH_PLANS_ERROR',
            message: error.message, correlationId: correlacion_id});

        return NextResponse.json(
            { success: false, message: 'Error al cargar los planes de precios' },
            { status: 500 }
        );
    }
}
