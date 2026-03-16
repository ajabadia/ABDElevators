import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal() {
    return withCorrelation(
        { level: 'INFO', source: 'API_PRICING', action: 'LIST_PLANS' },
        async ({ log, correlationId }) => {
            try {
                const db = await connectDB();
                
                await log({
                    message: 'Fetching public pricing plans'
                });

                const plans = await db.collection('pricing_plans')
                    .find({ isPublic: true })
                    .sort({ priceMonthly: 1 })
                    .toArray();

                await log({
                    message: `Retrieved ${plans.length} pricing plans`
                });

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
                        metricsSummary: Object.entries(plan.metrics || {}).map(([key, val]: [string, any]) => ({
                            metric: key,
                            type: val.type,
                            included: val.includedUnits || 0,
                            unitPrice: val.unitPrice || 0
                        }))
                    })),
                    correlationId
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_PRICING_PLANS_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/pricing/plans', thresholdMs: 1000 });
