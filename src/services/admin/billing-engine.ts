
import {
    MetricPricing,
    PricingType,
    TenantCredit
} from '@/lib/schemas';
import { BillingPolicy } from '@/lib/billing/BillingPolicy';

export interface BillingResult {
    totalCost: number;
    status: 'ALLOWED' | 'SURCHARGE' | 'BLOCKED';
    actionApplied?: string;
    details: {
        totalUsage: number;
        coveredByCredits: number;
        billableUsage: number;
        unitPriceUsed?: number;
        breakdown?: any[];
        overageUnits?: number;
        baseFeeApplied?: number;
        surchargeApplied?: number;
    };
    currency: string;
}

/**
 * Advanced Billing Engine - Refactored with Patterns
 * Delegates business rules to BillingPolicy.
 */
export class BillingEngine {

    /**
     * Calculates the final cost of a metric for a tenant.
     */
    static calculateMetricCost(
        usage: number,
        pricing: MetricPricing,
        credits: number = 0
    ): BillingResult {

        const billableUsage = Math.max(0, usage - credits);
        const coveredByCredits = usage - billableUsage;

        let totalCost = 0;
        let status: 'ALLOWED' | 'SURCHARGE' | 'BLOCKED' = 'ALLOWED';
        let actionApplied: string | undefined;

        let details: any = {
            totalUsage: usage,
            coveredByCredits,
            billableUsage
        };

        if (billableUsage <= 0 && pricing.type !== 'FLAT_FEE_OVERAGE') {
            return { totalCost: 0, status: 'ALLOWED', details, currency: pricing.currency };
        }

        switch (pricing.type) {
            case 'FIXED':
                totalCost = billableUsage * (pricing.unitPrice || 0);
                details.unitPriceUsed = pricing.unitPrice;
                break;

            case 'TIERED':
                const tieredResult = BillingPolicy.calculateTiered(billableUsage, pricing.tiers || []);
                totalCost = tieredResult.total;
                details.breakdown = tieredResult.breakdown;
                break;

            case 'RAPPEL':
                const rappelPrice = BillingPolicy.calculateRappel(billableUsage, pricing.thresholds || []);
                totalCost = billableUsage * rappelPrice;
                details.unitPriceUsed = rappelPrice;
                break;

            case 'FLAT_FEE_OVERAGE':
                const included = pricing.includedUnits || 0;
                const overageUnits = Math.max(0, billableUsage - included);
                totalCost = (pricing.baseFee || 0) + (overageUnits * (pricing.overagePrice || 0));

                details.overageUnits = overageUnits;
                details.baseFeeApplied = pricing.baseFee;

                // Call BillingPolicy for Smart Overage
                const overageControl = BillingPolicy.evaluateOverageControl(
                    billableUsage,
                    included,
                    pricing.overageRules || [],
                    totalCost
                );

                if (overageControl.status !== 'ALLOWED') {
                    status = overageControl.status as any;
                    totalCost += overageControl.surcharge;
                    details.surchargeApplied = overageControl.surcharge;
                    actionApplied = overageControl.annotation || undefined;
                }
                break;
        }

        return {
            totalCost: Math.round(totalCost * 100) / 100,
            status,
            actionApplied,
            details,
            currency: pricing.currency
        };
    }
}
