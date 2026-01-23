import {
    MetricPricing,
    PricingType,
    TenantCredit
} from './schemas';

export interface BillingResult {
    totalCost: number;
    details: {
        totalUsage: number;
        coveredByCredits: number;
        billableUsage: number;
        unitPriceUsed?: number;
        breakdown?: any[];
    };
    currency: string;
}

/**
 * Motor de Facturación Avanzada (Fase 9.1)
 * Implementa lógica de Tiers, Rappels y Créditos de cortesía.
 */
export class BillingEngine {

    /**
     * Calcula el coste final de una métrica para un tenant en el periodo actual.
     */
    static calculateMetricCost(
        usage: number,
        pricing: MetricPricing,
        credits: number = 0
    ): BillingResult {

        // 1. Aplicar créditos de cortesía/regalo primero
        const billableUsage = Math.max(0, usage - credits);
        const coveredByCredits = usage - billableUsage;

        let totalCost = 0;
        let details: any = {
            totalUsage: usage,
            coveredByCredits,
            billableUsage
        };

        if (billableUsage <= 0) {
            return { totalCost: 0, details, currency: pricing.currency };
        }

        // 2. Aplicar lógica según el tipo de tarificación
        switch (pricing.type) {
            case 'FIXED':
                totalCost = billableUsage * (pricing.unitPrice || 0);
                details.unitPriceUsed = pricing.unitPrice;
                break;

            case 'TIERED':
                const tieredResult = this.calculateTiered(billableUsage, pricing.tiers || []);
                totalCost = tieredResult.total;
                details.breakdown = tieredResult.breakdown;
                break;

            case 'RAPPEL':
                const rappelPrice = this.calculateRappel(billableUsage, pricing.thresholds || []);
                totalCost = billableUsage * rappelPrice;
                details.unitPriceUsed = rappelPrice;
                break;

            case 'FLAT_FEE_OVERAGE':
                const overageUnits = Math.max(0, billableUsage - (pricing.includedUnits || 0));
                totalCost = (pricing.baseFee || 0) + (overageUnits * (pricing.overagePrice || 0));
                details.overageUnits = overageUnits;
                details.baseFeeApplied = pricing.baseFee;
                break;
        }

        return {
            totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimals
            details,
            currency: pricing.currency
        };
    }

    /**
     * Lógica de TIERED (Escalado por tramos)
     * Ejemplo: 0-100 a 1€, 101-500 a 0.9€
     */
    private static calculateTiered(units: number, tiers: any[]) {
        let total = 0;
        const breakdown: any[] = [];

        // Ordenar tiers por el campo 'from'
        const sortedTiers = [...tiers].sort((a, b) => a.from - b.from);

        for (const tier of sortedTiers) {
            if (units <= tier.from) break;

            const tierMax = tier.to === null ? Infinity : tier.to;
            const unitsInTier = Math.min(units, tierMax) - tier.from;

            if (unitsInTier > 0) {
                const tierCost = unitsInTier * tier.unitPrice;
                total += tierCost;
                breakdown.push({
                    tier: `${tier.from}-${tier.to || '∞'}`,
                    units: unitsInTier,
                    unitPrice: tier.unitPrice,
                    subtotal: tierCost
                });
            }
        }

        return { total, breakdown };
    }

    /**
     * Lógica de RAPPEL (Descuento o recargo por volumen total)
     * A diferencia de Tiered, aquí TODAS las unidades pasan al nuevo precio.
     */
    private static calculateRappel(units: number, thresholds: any[]) {
        if (thresholds.length === 0) return 0;

        // Buscar el umbral más alto que se cumple
        const applicableThreshold = [...thresholds]
            .sort((a, b) => b.minUnits - a.minUnits)
            .find(t => units >= t.minUnits);

        return applicableThreshold ? applicableThreshold.price : thresholds[0].price;
    }
}
