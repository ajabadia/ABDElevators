import { connectDB } from './db';
import {
    GlobalPricingPlan,
    TenantBillingConfig,
    MetricPricing,
    GlobalPricingPlanSchema,
    TenantBillingConfigSchema,
    TenantCredit
} from './schemas';
import { BillingEngine, BillingResult } from './billing-engine';

/**
 * Orquestador de Facturación (Fase 9.1)
 * Maneja la herencia de precios y la integración con UsageLogs.
 */
export class BillingService {

    /**
     * Obtiene la configuración de precio efectiva para una métrica y un tenant.
     * Implementa la jerarquía: Price Schedule (Promo) -> Tenant Override -> Global Default
     */
    static async getEffectivePricing(tenantId: string, metric: string): Promise<MetricPricing | null> {
        const db = await connectDB();
        const now = new Date();

        // 1. Buscar si hay una promoción/cambio programado activo
        const tenantBilling = await db.collection('tenant_billing').findOne({ tenantId });
        if (tenantBilling?.schedules) {
            const activeSchedule = tenantBilling.schedules.find((s: any) =>
                s.metric === metric &&
                s.startsAt <= now &&
                (s.endsAt === null || s.endsAt >= now)
            );

            if (activeSchedule) {
                return activeSchedule.pricing;
            }
        }

        // 2. Buscar si hay override específico para el tenant (Acordado en contrato)
        if (tenantBilling?.overrides?.[metric]) {
            return tenantBilling.overrides[metric];
        }

        // 3. Buscar el plan asignado al tenant o el plan por defecto
        const planToUse = tenantBilling?.planSlug
            ? await db.collection('pricing_plans').findOne({ slug: tenantBilling.planSlug })
            : await db.collection('pricing_plans').findOne({ isDefault: true });

        if (planToUse?.metrics?.[metric]) {
            return planToUse.metrics[metric];
        }

        return null;
    }

    /**
     * Calcula el consumo y coste actual de un tenant para el periodo vigente.
     */
    static async calculateCurrentUsage(tenantId: string, metric: string): Promise<BillingResult | null> {
        const db = await connectDB();

        // 1. Obtener precios
        const pricing = await this.getEffectivePricing(tenantId, metric);
        if (!pricing) return null;

        // 2. Obtener créditos de cortesía/regalo activos
        const now = new Date();
        const credits = await db.collection('tenant_credits')
            .find({
                tenantId,
                metric,
                balance: { $gt: 0 },
                $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }]
            })
            .toArray() as unknown as TenantCredit[];

        const totalCredits = credits.reduce((acc, c) => acc + c.balance, 0);

        // 3. Obtener consumo acumulado del mes (desde el billingDay)
        const billingConfig = await db.collection('tenant_billing').findOne({ tenantId });
        const billingDay = billingConfig?.billingDay || 1;

        const startOfMonth = new Date();
        startOfMonth.setDate(billingDay);
        startOfMonth.setHours(0, 0, 0, 0);

        // Si el día de hoy es menor que el billingDay, el periodo empezó el mes pasado
        if (new Date().getDate() < billingDay) {
            startOfMonth.setMonth(startOfMonth.getMonth() - 1);
        }

        const usageLogs = await db.collection('usage_logs').find({
            tenantId,
            tipo: this.mapMetricToUsageType(metric),
            timestamp: { $gte: startOfMonth }
        }).toArray();

        const totalUsage = usageLogs.reduce((acc, log) => acc + (log.valor || 0), 0);

        // 4. Ejecutar el motor de cálculo
        return BillingEngine.calculateMetricCost(totalUsage, pricing, totalCredits);
    }

    /**
     * Inyecta los planes comerciales por defecto (Fase 9.1 + Monetización Híbrida)
     * Diseñado para ser llamado desde la UI de SuperAdmin.
     */
    static async seedDefaultPlans() {
        const db = await connectDB();

        const plans = [
            {
                name: "Standard",
                slug: "standard",
                description: "Ideal para equipos pequeños que están empezando con análisis RAG.",
                features: ["Hasta 10 informes/mes", "Acceso a base de conocimientos", "Soporte vía Email", "Exportación PDF básica"],
                isDefault: true,
                isPublic: true,
                popular: false,
                priceMonthly: 49,
                metrics: {
                    REPORTS: {
                        type: 'FLAT_FEE_OVERAGE',
                        currency: 'EUR',
                        baseFee: 0,
                        includedUnits: 10,
                        overagePrice: 2.00,
                        overageRules: [
                            { thresholdPercent: 120, action: 'BLOCK' }, // >120% (12 informes) bloquea
                            { thresholdPercent: 100, action: 'SURCHARGE_PERCENT', value: 20 } // >100% (10 informes) aplica recargo 20% sobre overage
                        ]
                    },
                    API_CALLS: { type: 'FIXED', unitPrice: 0.10 }
                }
            },
            {
                name: "Pro",
                slug: "pro",
                description: "Potencia para empresas en crecimiento con flujos constantes de pedidos.",
                features: ["50 informes incluidos", "Prioridad en cola de procesamiento", "Multi-usuario (hasta 5)", "Soporte Premium"],
                isDefault: false,
                isPublic: true,
                popular: true,
                priceMonthly: 149,
                metrics: {
                    REPORTS: {
                        type: 'TIERED',
                        currency: 'EUR',
                        tiers: [
                            { from: 0, to: 50, unitPrice: 0 }, // Incluidos en el fee
                            { from: 51, to: 200, unitPrice: 1.50 },
                            { from: 201, to: null, unitPrice: 1.20 }
                        ],
                        overageRules: [
                            { thresholdPercent: 110, action: 'SURCHARGE_PERCENT', value: 5 } // >110% uso aplica recargo del 5%
                        ]
                    },
                    API_CALLS: { type: 'FIXED', unitPrice: 0.05 }
                }
            },
            {
                name: "Premium",
                slug: "premium",
                description: "Escalabilidad total para departamentos técnicos de alto rendimiento.",
                features: ["200 informes incluidos", "API Access Unlimited", "Branding Corporativo", "Audit Trail avanzado"],
                isDefault: false,
                isPublic: true,
                popular: false,
                priceMonthly: 449,
                metrics: {
                    REPORTS: {
                        type: 'RAPPEL',
                        currency: 'EUR',
                        thresholds: [
                            { minUnits: 0, price: 1.00 },
                            { minUnits: 500, price: 0.80 } // Si pasas de 500, todos a 0.80
                        ]
                    },
                    API_CALLS: { type: 'FIXED', unitPrice: 0.02 }
                }
            },
            {
                name: "Ultra",
                slug: "ultra",
                description: "Despliegue dedicado y máxima capacidad de procesamiento diario.",
                features: ["Informes ilimitados ajustables", "VPC Dedicada", "SLA Bancario 99.99%", "Integración SAP/Dynamics"],
                isDefault: false,
                isPublic: true,
                popular: false,
                priceMonthly: 999,
                metrics: {
                    REPORTS: {
                        type: 'FIXED',
                        unitPrice: 0.50
                    },
                    API_CALLS: { type: 'FIXED', unitPrice: 0.01 }
                }
            }
        ];

        // Limpiar y reinsertar (Idempotencia)
        await db.collection('pricing_plans').deleteMany({ isPublic: true });
        return await db.collection('pricing_plans').insertMany(plans);
    }

    /**
     * Cambia el plan de un tenant y gestiona el prorrateo básico (Créditos).
     */
    static async changePlan(tenantId: string, newPlanSlug: string): Promise<{ success: boolean; creditApplied?: number }> {
        const db = await connectDB();

        // 1. Validar nuevo plan
        const newPlan = await db.collection('pricing_plans').findOne({ slug: newPlanSlug });
        if (!newPlan) throw new Error("PLAN_NOT_FOUND");

        // 2. Obtener config actual
        const currentConfig = await db.collection('tenant_billing').findOne({ tenantId });
        const currentPlanSlug = currentConfig?.planSlug || 'standard';

        if (currentPlanSlug === newPlanSlug) return { success: true };

        const currentPlan = await db.collection('pricing_plans').findOne({ slug: currentPlanSlug });

        // 3. Calcular prorrateo (Simplificado: Días restantes del mes)
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysRemaining = daysInMonth - now.getDate();

        let creditApplied = 0;
        if (currentPlan && currentPlan.priceMonthly > 0) {
            // Devolvemos lo no consumido como crédito
            const dailyRate = currentPlan.priceMonthly / daysInMonth;
            creditApplied = Math.floor(dailyRate * daysRemaining);

            if (creditApplied > 0) {
                await this.addCourtesyCredits({
                    tenantId,
                    metric: 'SUBSCRIPTION_CREDIT',
                    amount: creditApplied,
                    reason: `Prorrateo cambio de plan: ${currentPlanSlug} -> ${newPlanSlug}`,
                    source: 'MANUAL_ADJUSTMENT'
                });
            }
        }

        // 4. Actualizar el plan
        await db.collection('tenant_billing').updateOne(
            { tenantId },
            { $set: { planSlug: newPlanSlug } },
            { upsert: true }
        );

        return { success: true, creditApplied };
    }

    /**
     * Mapea el nombre de la métrica al tipo de log de uso
     */
    private static mapMetricToUsageType(metric: string): string {
        const maps: Record<string, string> = {
            'REPORTS': 'REPORTS_GENERATED',
            'API_CALLS': 'API_CALL',
            'STORAGE': 'STORAGE_BYTES'
        };
        return maps[metric] || metric;
    }

    /**
     * Inyecta créditos de cortesía a un tenant (Regalo/Promoción)
     */
    static async addCourtesyCredits(data: {
        tenantId: string,
        metric: string,
        amount: number,
        reason: string,
        source: 'GIFT_CODE' | 'MANUAL_ADJUSTMENT' | 'PROMO',
        daysValid?: number
    }) {
        const db = await connectDB();

        const expiryDate = data.daysValid
            ? new Date(Date.now() + data.daysValid * 24 * 60 * 60 * 1000)
            : null;

        const credit: TenantCredit = {
            tenantId: data.tenantId,
            metric: data.metric,
            balance: data.amount,
            source: data.source,
            reason: data.reason,
            expiryDate
        };

        return await db.collection('tenant_credits').insertOne(credit);
    }
}
