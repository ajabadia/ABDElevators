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
     * Implementa la jerarquía: Tenant Override -> Global Default
     */
    static async getEffectivePricing(tenantId: string, metric: string): Promise<MetricPricing | null> {
        const db = await connectDB();

        // 1. Buscar si hay override específico para el tenant
        const tenantConfig = await db.collection('tenant_billing').findOne({ tenantId });
        if (tenantConfig?.overrides?.[metric]) {
            return tenantConfig.overrides[metric];
        }

        // 2. Si no hay override, buscar el Plan Global por defecto
        const globalPlan = await db.collection('pricing_plans').findOne({ isDefault: true });
        if (globalPlan?.metrics?.[metric]) {
            return globalPlan.metrics[metric];
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
     * Inyecta los planes comerciales por defecto (Fase 9.1)
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
                        overagePrice: 2.00
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
     * Mapea el nombre de la métrica al tipo de log de uso
     */
    private static mapMetricToUsageType(metric: string): string {
        const maps: Record<string, string> = {
            'REPORTS': 'LLM_TOKENS', // Podríamos cambiarlo a 'REPORTS_GENERATED' si cobramos por unidad
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
