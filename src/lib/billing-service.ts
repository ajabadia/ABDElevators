import { UsageService } from './usage-service';
import { TenantService } from './tenant-service';
import { TenantConfig, GlobalPricingPlanSchema } from './schemas';
import { ObjectId } from 'mongodb';
import { ValidationError } from './errors';

export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    meta?: any;
}

export interface InvoiceData {
    id: string;
    number: string;
    issueDate: Date;
    dueDate: Date;
    tenant: {
        id: string;
        name: string;
        fiscalName?: string;
        taxId?: string;
        address?: string;
    };
    lineItems: InvoiceLineItem[];
    subtotal: number;
    taxRate: number; // 0.21 for 21%
    taxAmount: number;
    total: number;
    currency: string;
    status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE';
}

// Precios Base Mockeados (en el futuro vendrán de DB)
const PRICING_PLANS = {
    'FREE': {
        name: 'Free Tier',
        baseFee: 0,
        limits: { tokens: 1000000, storage: 1024 * 1024 * 100 }, // 100MB
        overage: { tokens: 0, storage: 0 }
    },
    'PRO': {
        name: 'Pro Tier',
        baseFee: 299,
        included: { tokens: 10000000, storage: 1024 * 1024 * 1024 * 10 }, // 10GB
        overage: { tokens: 0.000005, storage: 0.05 } // $5 per million tokens, $0.05 per GB
    },
    'ENTERPRISE': {
        name: 'Enterprise Tier',
        baseFee: 999,
        included: { tokens: 100000000, storage: 1024 * 1024 * 1024 * 100 }, // 100GB
        overage: { tokens: 0.000003, storage: 0.03 }
    }
};

export class BillingService {

    /**
     * Cambia el plan de suscripción de un tenant.
     * @param tenantId ID del tenant
     * @param newPlanSlug Slug del nuevo plan (e.g., 'PRO', 'ENTERPRISE')
     */
    static async changePlan(tenantId: string, newPlanSlug: string) {
        const tier = newPlanSlug.toUpperCase();

        if (!(tier in PRICING_PLANS)) {
            throw new ValidationError(`Plan inválido: ${newPlanSlug}. Planes válidos: ${Object.keys(PRICING_PLANS).join(', ')}`);
        }

        // 1. Obtener configuración actual completa (necesario para validación Zod en updateConfig)
        const currentConfig = await TenantService.getConfig(tenantId);

        // 2. Preparar nueva configuración manteniendo datos existentes
        const updatedConfig = {
            ...currentConfig,
            subscription: {
                ...(currentConfig.subscription || {}),
                tier: tier as any,
                status: 'ACTIVE' as const,
                current_period_start: new Date()
            }
        };

        // 3. Persistir cambios
        await TenantService.updateConfig(tenantId, updatedConfig, {
            performedBy: 'system-billing',
            correlacion_id: `change-plan-${Date.now()}`
        });

        return { success: true, creditApplied: false };
    }

    /**
     * Calcula la factura del mes actual (o especificado)
     */
    static async generateInvoicePreview(tenantId: string, month: number, year: number): Promise<InvoiceData> {
        // 1. Obtener Configuración del Tenant Real (Migrado a Auth DB)
        const tenantConfig = await TenantService.getConfig(tenantId);

        const tier = (tenantConfig.subscription?.tier as keyof typeof PRICING_PLANS) || 'FREE';
        const plan = PRICING_PLANS[tier];

        // 2. Obtener Uso
        // Aquí conectamos con UsageService. 
        // UsageService.getUsageStats normally returns aggregate, we need precise range.
        // Simulamos valores para el preview si no hay método específico range.

        // En una implementación real: UsageService.getUsage(tenantId, start, end)
        // Por ahora usamos valores simulados basados en trackLLM
        const tokensUsed = 15000000; // Mock activity
        const storageUsed = 5 * 1024 * 1024 * 1024; // 5GB

        const lineItems: InvoiceLineItem[] = [];

        // Base Fee
        if (plan.baseFee > 0) {
            lineItems.push({
                description: `Suscripción Mensual - Plan ${plan.name}`,
                quantity: 1,
                unitPrice: plan.baseFee,
                total: plan.baseFee
            });
        }

        // Overage Tokens
        if (plan.overage.tokens > 0) {
            const includedTokens = (plan as any).included?.tokens || 0;
            const excessTokens = Math.max(0, tokensUsed - includedTokens);
            if (excessTokens > 0) {
                const cost = excessTokens * plan.overage.tokens;
                lineItems.push({
                    description: `Exceso Tokens IA (${excessTokens.toLocaleString()} tokens)`,
                    quantity: excessTokens,
                    unitPrice: plan.overage.tokens,
                    total: cost
                });
            }
        }

        const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
        const taxRate = 0.21; // IVA España
        const taxAmount = subtotal * taxRate;

        const invoiceNumber = `INV-${year}${month.toString().padStart(2, '0')}-${tenantId.substring(0, 4).toUpperCase()}`;

        return {
            id: new ObjectId().toString(),
            number: invoiceNumber,
            issueDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
            tenant: {
                id: tenantId,
                name: tenantConfig.name,
                fiscalName: tenantConfig.billing?.fiscalName,
                taxId: tenantConfig.billing?.taxId,
                address: tenantConfig.billing?.billingAddress?.line1
            },
            lineItems,
            subtotal,
            taxRate,
            taxAmount,
            total: subtotal + taxAmount,
            currency: 'EUR',
            status: 'DRAFT'
        };
    }

    /**
     * Guarda la configuración fiscal del tenant
     */
    static async updateFiscalData(tenantId: string, billingData: any) {
        // Delegar en TenantService para asegurar persistencia en Auth DB
        return await TenantService.updateConfig(tenantId, {
            billing: billingData
        });
    }
    /**
     * Seeds the billing plans into the database.
     * Used by scripts/seed-plans-v2.ts
     */
    static async seedDefaultPlans() {
        const { connectDB } = await import('./db');
        const db = await connectDB();
        const { PLANS } = await import('./plans');

        const plansToInsert = Object.values(PLANS).map(plan => ({
            ...plan,
            slug: plan.tier.toLowerCase(),
            active: true,
            updatedAt: new Date()
        }));

        // Upsert logical: delete current and insert new (simple seed)
        await db.collection('pricing_plans').deleteMany({});
        return await db.collection('pricing_plans').insertMany(plansToInsert);
    }
}
