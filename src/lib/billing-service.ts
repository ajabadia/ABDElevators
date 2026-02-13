import { UsageService } from './usage-service';
import { TenantService } from './tenant-service';
import { PLANS, PlanTier } from './plans';
import { ObjectId } from 'mongodb';
import { ValidationError, AppError } from './errors';
import { getTenantCollection } from './db-tenant';
import { TenantSubscriptionSchema, TenantSubscription } from './schemas/billing';
import { logEvento } from './logger';

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
    totalAmount?: number; // Compatibilidad UI
    tierName?: string;    // Compatibilidad UI
    isManual?: boolean;   // Compatibilidad UI
    currency: string;
    status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE';
}

// Los planes ahora se centralizan en plans.ts

export class BillingService {

    /**
     * Calcula el uso actual de un recurso y determina si se excede el límite
     */
    static async calculateCurrentUsage(tenantId: string, metric: string): Promise<{
        currentUsage: number;
        limit: number;
        status: 'OK' | 'SURCHARGE' | 'BLOCKED';
        actionApplied?: string;
    } | null> {
        // 1. Obtener Configuración
        const config = await TenantService.getConfig(tenantId);
        const tier = (config.subscription?.planSlug as PlanTier) || 'FREE';
        const plan = PLANS[tier];

        // 2. Determinar límites según métrica
        let limit = 0;
        let usage = 0;
        const customLimits = (config as any).customLimits || {};

        if (metric === 'TOKENS') {
            limit = customLimits.llm_tokens_per_month ?? plan.limits.llm_tokens_per_month;
            // Mock value for safe build - Integration with UsageService pending
            usage = 0;
        } else if (metric === 'STORAGE') {
            limit = customLimits.storage_bytes ?? ((config.storage?.quota_bytes) || plan.limits.storage_bytes || 0); // Corrected property access
            usage = 0;
        } else {
            // Unknown metric, allow pass
            return { currentUsage: 0, limit: 0, status: 'OK' };
        }

        // 3. Evaluar
        if (limit > 0 && usage > limit) {
            // lógica simple: si es FREE bloquea, si es PAGADO surcharge (mock)
            if (tier === 'FREE') return { currentUsage: usage, limit, status: 'BLOCKED', actionApplied: 'Upgrade required' };
            return { currentUsage: usage, limit, status: 'SURCHARGE' };
        }

        return { currentUsage: usage, limit, status: 'OK' };
    }

    /**
     * Cambia el plan de suscripción de un tenant.
     * @param tenantId ID del tenant
     * @param newPlanSlug Slug del nuevo plan (e.g., 'PRO', 'ENTERPRISE')
     */
    static async changePlan(tenantId: string, newPlanSlug: string) {
        const tier = newPlanSlug.toUpperCase();

        if (!(tier in PLANS)) {
            throw new ValidationError(`Plan inválido: ${newPlanSlug}. Planes válidos: ${Object.keys(PLANS).join(', ')}`);
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
            correlationId: `change-plan-${Date.now()}`
        });

        // 4. Auditoría Extendida (Phase 132.3)
        const { AuditTrailService } = await import('./services/audit-trail-service');
        await AuditTrailService.logConfigChange({
            actorType: 'SYSTEM',
            actorId: 'system-billing',
            tenantId,
            action: 'BILLING_PLAN_CHANGE',
            entityType: 'BILLING',
            entityId: tenantId,
            changes: {
                before: currentConfig.subscription?.planSlug,
                after: tier
            },
            correlationId: `change-plan-${Date.now()}`
        } as any);

        return { success: true, creditApplied: false };
    }

    /**
     * Calcula la factura del mes actual (o especificado)
     */
    static async generateInvoicePreview(tenantId: string, month: number, year: number): Promise<InvoiceData> {
        // 1. Obtener Configuración del Tenant Real (Migrado a Auth DB)
        const tenantConfig = await TenantService.getConfig(tenantId);

        const tier = (tenantConfig.subscription?.planSlug as PlanTier) || 'FREE';
        const plan = PLANS[tier];

        // 2. Obtener Uso Real
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        const usage = await UsageService.getAggregateUsage(tenantId, startOfMonth, endOfMonth);

        const tokensUsed = usage['LLM_TOKENS'] || 0;
        const searchesUsed = usage['VECTOR_SEARCH'] || 0;
        const storageUsed = usage['STORAGE_BYTES'] || 0;

        const lineItems: InvoiceLineItem[] = [];

        // Base Fee
        if (plan.price_monthly > 0) {
            lineItems.push({
                description: `Suscripción Mensual - Plan ${plan.name}`,
                quantity: 1,
                unitPrice: plan.price_monthly,
                total: plan.price_monthly
            });
        }

        // Overage Tokens
        if (plan.overage.tokens > 0) {
            const customLimits = (tenantConfig as any).customLimits || {};
            const includedTokens = customLimits.llm_tokens_per_month ?? plan.limits.llm_tokens_per_month;
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
            totalAmount: subtotal + taxAmount, // Para compatibilidad UI
            tierName: plan.name, // Para compatibilidad UI
            isManual: true, // Siempre manual por ahora
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

    /**
     * Actualiza manualmente la suscripción de un tenant.
     * Fase 120.2: Manual Billing Control
     */
    static async manualUpdateSubscription(
        tenantId: string,
        data: Partial<TenantSubscription>,
        updatedBy: string
    ) {
        const collection = await getTenantCollection('tenants');
        const tenant = await collection.findOne({ tenantId });

        if (!tenant) throw new AppError('NOT_FOUND', 404, 'Tenant no encontrado');

        const currentSub = (tenant as any).subscription || { planSlug: 'FREE', status: 'active' };

        const newSubData: TenantSubscription = {
            ...currentSub,
            ...data,
            updatedAt: new Date(),
            createdAt: currentSub.createdAt || new Date()
        };

        // Validar con Zod
        const validated = TenantSubscriptionSchema.parse(newSubData);

        await collection.updateOne(
            { tenantId },
            { $set: { subscription: validated, updatedAt: new Date() } }
        );

        // Auditoría Unificada (Phase 132.3)
        const { AuditTrailService } = await import('./services/audit-trail-service');
        await AuditTrailService.logConfigChange({
            actorType: 'USER',
            actorId: updatedBy,
            tenantId,
            action: 'MANUAL_SUBSCRIPTION_UPDATE',
            entityType: 'BILLING',
            entityId: tenantId,
            changes: {
                before: currentSub,
                after: validated
            },
            correlationId: `manual_${Date.now()}`
        } as any);

        await logEvento({
            level: 'INFO',
            source: 'BILLING_SERVICE',
            action: 'MANUAL_SUB_UPDATE',
            message: `Suscripción actualizada manualmente para ${tenantId} por ${updatedBy}`,
            correlationId: `manual_${Date.now()}`,
            details: { previous: currentSub.planSlug, current: validated.planSlug }
        });

        return validated;
    }
}
