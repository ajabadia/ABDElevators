
/**
 * BillingPolicy - Pure business rules for the billing system.
 * Phase 8: High-Impact Polish
 */
export class BillingPolicy {

    /**
     * Calculates tiered pricing breakdown.
     */
    static calculateTiered(units: number, tiers: Array<{ from: number, to: number | null, unitPrice: number }>) {
        let total = 0;
        const breakdown: any[] = [];
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
     * Calculates rappel pricing (flat discount based on total volume).
     */
    static calculateRappel(units: number, thresholds: Array<{ minUnits: number, price: number }>) {
        if (thresholds.length === 0) return 0;
        const applicableThreshold = [...thresholds]
            .sort((a, b) => b.minUnits - a.minUnits)
            .find(t => units >= t.minUnits);
        return applicableThreshold ? applicableThreshold.price : thresholds[0].price;
    }

    /**
     * Checks for overage violations and surcharges.
     */
    static evaluateOverageControl(
        units: number,
        limit: number,
        rules: Array<{ thresholdPercent: number, action: string, value?: number }>,
        baseCost: number
    ) {
        if (limit <= 0 || !rules || rules.length === 0) return { status: 'ALLOWED', surcharge: 0, annotation: null };

        const usagePercent = (units / limit) * 100;
        const applicableRule = [...rules]
            .sort((a, b) => b.thresholdPercent - a.thresholdPercent)
            .find(rule => usagePercent > rule.thresholdPercent);

        if (!applicableRule) return { status: 'ALLOWED', surcharge: 0, annotation: null };

        if (applicableRule.action === 'BLOCK') {
            return {
                status: 'BLOCKED',
                surcharge: 0,
                annotation: `Limite crítico bloqueado (> ${applicableRule.thresholdPercent}%)`
            };
        }

        let surcharge = 0;
        if (applicableRule.action === 'SURCHARGE_PERCENT') {
            surcharge = baseCost * ((applicableRule.value || 0) / 100);
        } else if (applicableRule.action === 'SURCHARGE_FIXED') {
            surcharge = applicableRule.value || 0;
        }

        return {
            status: 'SURCHARGE',
            surcharge,
            annotation: `Recargo aplicado por uso > ${applicableRule.thresholdPercent}%`
        };
    }
}
