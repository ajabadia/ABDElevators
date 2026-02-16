import { UsageService } from './usage-service';
import { TenantService } from './tenant-service';
import { PLANS, PlanTier } from './plans';
import { ObjectId } from 'mongodb';
import { ValidationError, AppError } from './errors';
import { getTenantCollection } from './db-tenant';
import { TenantSubscriptionSchema, TenantSubscription } from './schemas/billing';
import { logEvento } from './logger';
import { stripe, createCheckoutSession } from './stripe';
import Stripe from 'stripe';
import crypto from 'crypto';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    meta?: Record<string, unknown>;
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

interface TenantConfigCustomLimits {
    llm_tokens_per_month?: number;
    storage_bytes?: number;
    [key: string]: number | undefined;
}

interface BillingFiscalData {
    fiscalName?: string;
    taxId?: string;
    billingAddress?: { line1?: string;[key: string]: string | undefined };
}

// ────────────────────────────────────────────────────────────────────────────
// BillingService — Unified (Phase 133.7)
// ────────────────────────────────────────────────────────────────────────────

/**
 * 💸 BillingService: Unified service for Stripe integration, usage calculation,
 *    invoice generation, and plan management. (Phase 120.2 & 133.7)
 */
export class BillingService {

    // ── Stripe Integration ─────────────────────────────────────────────────

    /**
     * Inicia el flujo de suscripción Stripe para un tenant.
     */
    static async startSubscriptionFlow(tenantId: string, tier: string, email: string, returnUrl: string): Promise<{ url: string }> {
        const correlationId = crypto.randomUUID();

        try {
            const config = await TenantService.getConfig(tenantId);
            const customerId = (config.subscription as any)?.stripeCustomerId || undefined;

            const session = await createCheckoutSession({
                tenantId,
                tier: tier as 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE',
                customerId,
                successUrl: `${process.env.NEXTAUTH_URL}/admin/billing/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${process.env.NEXTAUTH_URL}/admin/billing/plan`,
            });

            if (!session.url) {
                throw new AppError('EXTERNAL_SERVICE_ERROR', 503, 'Stripe session created without URL', { correlationId });
            }

            return { url: session.url };
        } catch (error: unknown) {
            await logEvento({
                level: 'ERROR',
                source: 'BILLING_SERVICE',
                action: 'START_SUB_FLOW_ERROR',
                correlationId,
                message: error instanceof Error ? error.message : 'Unknown error initiating subscription',
                details: { tenantId, tier, stack: error instanceof Error ? error.stack : undefined }
            });

            if (error instanceof AppError) throw error;
            throw new AppError('EXTERNAL_SERVICE_ERROR', 503, 'Could not initiate checkout', { originalError: error });
        }
    }

    /**
     * Procesa eventos de Stripe (Webhooks).
     */
    static async handleWebhookEvent(event: Stripe.Event): Promise<void> {
        const correlationId = crypto.randomUUID();

        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, correlationId);
                    break;
                case 'invoice.paid':
                    await this.handleInvoicePaid(event.data.object as Stripe.Invoice, correlationId);
                    break;
                case 'invoice.payment_failed':
                    await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, correlationId);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription, correlationId);
                    break;
                default:
                    break;
            }
        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source: 'BILLING_SERVICE',
                action: 'WEBHOOK_PROCESS_ERROR',
                correlationId,
                message: error instanceof Error ? error.message : 'Error processing webhook',
                details: { eventType: event.type }
            });
            throw error;
        }
    }

    private static async handleCheckoutCompleted(session: Stripe.Checkout.Session, correlationId: string): Promise<void> {
        const tenantId = session.metadata?.tenantId;
        if (!tenantId) {
            await logEvento({
                level: 'WARN',
                source: 'BILLING_SERVICE',
                action: 'WEBHOOK_IGNORED',
                correlationId,
                message: 'Checkout completed without tenantId metadata',
                details: { sessionId: session.id }
            });
            return;
        }

        await TenantService.updateConfig(tenantId, {
            'subscription.stripeCustomerId': (session.customer as string) || null,
            'subscription.stripeSubscriptionId': (session.subscription as string) || null,
            'subscription.status': 'active',
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId });

        await logEvento({
            level: 'INFO',
            source: 'BILLING_SERVICE',
            action: 'SUBSCRIPTION_ACTIVATED',
            correlationId,
            message: `Subscription activated for tenant ${tenantId}`,
            details: { tenantId, subscriptionId: session.subscription }
        });
    }

    private static async handleInvoicePaid(invoice: Stripe.Invoice, correlationId: string): Promise<void> {
        const invoiceObj = invoice as unknown as { subscription: string | Stripe.Subscription | null; id: string };
        const subscriptionId = typeof invoiceObj.subscription === 'string'
            ? invoiceObj.subscription
            : invoiceObj.subscription?.id;

        if (!subscriptionId) return;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const tenantId = subscription.metadata?.tenantId;
        if (!tenantId) {
            await logEvento({
                level: 'WARN',
                source: 'BILLING_SERVICE',
                action: 'BILLING_WEBHOOK_WARN',
                correlationId,
                message: 'Invoice paid linked to subscription without tenantId',
                details: { invoiceId: invoice.id, subscriptionId }
            });
            return;
        }

        const subData = subscription as unknown as { current_period_end: number };
        await TenantService.updateConfig(tenantId, {
            'subscription.status': 'active',
            'subscription.currentPeriodEnd': new Date(subData.current_period_end * 1000),
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId });
    }

    private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice, correlationId: string): Promise<void> {
        const invoiceObj = invoice as unknown as { subscription: string | Stripe.Subscription | null; id: string };
        const subscriptionId = typeof invoiceObj.subscription === 'string'
            ? invoiceObj.subscription
            : invoiceObj.subscription?.id;

        if (!subscriptionId) return;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const tenantId = subscription.metadata?.tenantId;
        if (!tenantId) return;

        await TenantService.updateConfig(tenantId, {
            'subscription.status': 'past_due',
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId });

        await logEvento({
            level: 'WARN',
            source: 'BILLING_SERVICE',
            action: 'PAYMENT_FAILED',
            correlationId,
            message: `Payment failed for tenant ${tenantId}`,
            details: { invoiceId: invoice.id, tenantId }
        });
    }

    private static async handleSubscriptionDeleted(subscription: Stripe.Subscription, correlationId: string): Promise<void> {
        const tenantId = subscription.metadata?.tenantId;
        if (!tenantId) return;

        await TenantService.updateConfig(tenantId, {
            'subscription.status': 'canceled',
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId });

        await logEvento({
            level: 'INFO',
            source: 'BILLING_SERVICE',
            action: 'SUBSCRIPTION_CANCELED',
            correlationId,
            message: `Subscription canceled for tenant ${tenantId}`,
            details: { tenantId }
        });
    }

    // ── Usage Calculation ──────────────────────────────────────────────────

    /**
     * Calcula el uso actual de un recurso y determina si se excede el límite.
     */
    static async calculateCurrentUsage(tenantId: string, metric: string): Promise<{
        currentUsage: number;
        limit: number;
        status: 'OK' | 'SURCHARGE' | 'BLOCKED';
        actionApplied?: string;
    } | null> {
        const config = await TenantService.getConfig(tenantId);
        const tier = (config.subscription?.planSlug as PlanTier) || 'FREE';
        const plan = PLANS[tier];

        let limit = 0;
        let usage = 0;
        const customLimits = ((config as Record<string, unknown>).customLimits as TenantConfigCustomLimits) || {};

        if (metric === 'TOKENS') {
            limit = customLimits.llm_tokens_per_month ?? plan.limits.llm_tokens_per_month;
            usage = 0; // TODO: Integrate with UsageService aggregation
        } else if (metric === 'STORAGE') {
            limit = customLimits.storage_bytes ?? ((config.storage?.quota_bytes) || plan.limits.storage_bytes || 0);
            usage = 0;
        } else {
            return { currentUsage: 0, limit: 0, status: 'OK' };
        }

        if (limit > 0 && usage > limit) {
            if (tier === 'FREE') return { currentUsage: usage, limit, status: 'BLOCKED', actionApplied: 'Upgrade required' };
            return { currentUsage: usage, limit, status: 'SURCHARGE' };
        }

        return { currentUsage: usage, limit, status: 'OK' };
    }

    // ── Plan Management ────────────────────────────────────────────────────

    /**
     * Cambia el plan de suscripción de un tenant.
     */
    static async changePlan(tenantId: string, newPlanSlug: string): Promise<{ success: boolean; creditApplied: boolean }> {
        const tier = newPlanSlug.toUpperCase();

        if (!(tier in PLANS)) {
            throw new ValidationError(`Plan inválido: ${newPlanSlug}. Planes válidos: ${Object.keys(PLANS).join(', ')}`);
        }

        const currentConfig = await TenantService.getConfig(tenantId);

        const updatedConfig = {
            ...currentConfig,
            subscription: {
                ...((currentConfig?.subscription as any) || {}),
                tier: tier as PlanTier,
                status: 'ACTIVE' as const,
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                createdAt: (currentConfig?.subscription as any)?.createdAt || new Date(),
                updatedAt: new Date()
            }
        };

        const correlationId = `change-plan-${Date.now()}`;

        await TenantService.updateConfig(tenantId, updatedConfig, {
            performedBy: 'system-billing',
            correlationId
        });

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
            correlationId
        } as Parameters<typeof AuditTrailService.logConfigChange>[0]);

        return { success: true, creditApplied: false };
    }

    /**
     * Simula el cambio de plan para mostrar el prorrateo exacto.
     */
    static async simulatePlanChange(tenantId: string, newTier: PlanTier): Promise<{
        creditApplied: number;
        newPlanCost: number;
        totalDueNow: number;
        currency: string;
        nextBillingDate: Date;
    }> {
        const config = await TenantService.getConfig(tenantId);
        const sub = config.subscription as unknown as TenantSubscription;

        if (!sub?.stripeCustomerId || !sub?.stripeSubscriptionId) {
            // Si no tiene Stripe (ej: periodo de prueba manual), devolvemos el precio base sin prorrateo
            const plan = PLANS[newTier];
            return {
                creditApplied: 0,
                newPlanCost: plan.price_monthly,
                totalDueNow: plan.price_monthly,
                currency: 'EUR',
                nextBillingDate: new Date(new Date().setDate(new Date().getDate() + 30))
            };
        }

        const plan = PLANS[newTier];
        const targetPriceId = plan.stripePriceId;

        if (!targetPriceId) {
            throw new ValidationError(`El plan ${newTier} no tiene un Price ID asociado en Stripe.`);
        }

        const { getUpcomingInvoice } = await import('./stripe');
        const invoicePreview = await getUpcomingInvoice(
            sub.stripeCustomerId,
            sub.stripeSubscriptionId,
            targetPriceId
        );

        // Identificar líneas de crédito (negativas) y cargos nuevos (positivos)
        let credit = 0;
        let debit = 0;

        invoicePreview.lines.data.forEach(line => {
            if (line.amount < 0) credit += Math.abs(line.amount);
            else debit += line.amount;
        });

        return {
            creditApplied: credit / 100,
            newPlanCost: debit / 100,
            totalDueNow: invoicePreview.amount_due / 100,
            currency: invoicePreview.currency.toUpperCase(),
            nextBillingDate: new Date(invoicePreview.next_payment_attempt! * 1000)
        };
    }

    // ── Invoice Generation ─────────────────────────────────────────────────

    /**
     * Calcula la factura del mes actual (o especificado).
     */
    static async generateInvoicePreview(tenantId: string, month: number, year: number): Promise<InvoiceData> {
        const tenantConfig = await TenantService.getConfig(tenantId);

        const tier = (tenantConfig.subscription?.planSlug as PlanTier) || 'FREE';
        const plan = PLANS[tier];

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        const usage = await UsageService.getAggregateUsage(tenantId, startOfMonth, endOfMonth);

        const tokensUsed = usage['LLM_TOKENS'] || 0;

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
            const customLimits = ((tenantConfig as Record<string, unknown>).customLimits as TenantConfigCustomLimits) || {};
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
        const taxRate = 0.21;
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
                fiscalName: (tenantConfig.billing as BillingFiscalData)?.fiscalName,
                taxId: (tenantConfig.billing as BillingFiscalData)?.taxId,
                address: (tenantConfig.billing as BillingFiscalData)?.billingAddress?.line1
            },
            lineItems,
            subtotal,
            taxRate,
            taxAmount,
            total: subtotal + taxAmount,
            totalAmount: subtotal + taxAmount,
            tierName: plan.name,
            isManual: true,
            currency: 'EUR',
            status: 'DRAFT'
        };
    }

    // ── Fiscal Data ────────────────────────────────────────────────────────

    /**
     * Guarda la configuración fiscal del tenant.
     */
    static async updateFiscalData(tenantId: string, billingData: BillingFiscalData): Promise<unknown> {
        return await TenantService.updateConfig(tenantId, {
            billing: billingData
        });
    }

    // ── Seed Plans ─────────────────────────────────────────────────────────

    /**
     * Seeds the billing plans into the database.
     */
    static async seedDefaultPlans(): Promise<unknown> {
        const { connectDB } = await import('./db');
        const db = await connectDB();

        const plansToInsert = Object.values(PLANS).map(plan => ({
            ...plan,
            slug: plan.tier.toLowerCase(),
            active: true,
            updatedAt: new Date()
        }));

        await db.collection('pricing_plans').deleteMany({});
        return await db.collection('pricing_plans').insertMany(plansToInsert);
    }

    // ── Manual Subscription ────────────────────────────────────────────────

    /**
     * Actualiza manualmente la suscripción de un tenant.
     */
    static async manualUpdateSubscription(
        tenantId: string,
        data: Partial<TenantSubscription>,
        updatedBy: string
    ): Promise<TenantSubscription> {
        const collection = await getTenantCollection('tenants');
        const tenant = await collection.findOne({ tenantId });

        if (!tenant) throw new AppError('NOT_FOUND', 404, 'Tenant no encontrado');

        const currentSub = (tenant.subscription as Partial<TenantSubscription>) || { planSlug: 'FREE' as const, status: 'active' as const };

        const newSubData: TenantSubscription = {
            ...currentSub,
            ...data,
            updatedAt: new Date(),
            createdAt: (currentSub as TenantSubscription).createdAt || new Date()
        } as TenantSubscription;

        const validated = TenantSubscriptionSchema.parse(newSubData);

        await collection.updateOne(
            { tenantId },
            { $set: { subscription: validated, updatedAt: new Date() } }
        );

        const correlationId = `manual_${Date.now()}`;

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
            correlationId
        } as Parameters<typeof AuditTrailService.logConfigChange>[0]);

        await logEvento({
            level: 'INFO',
            source: 'BILLING_SERVICE',
            action: 'MANUAL_SUB_UPDATE',
            message: `Suscripción actualizada manualmente para ${tenantId} por ${updatedBy}`,
            correlationId,
            details: { previous: currentSub.planSlug, current: validated.planSlug }
        });

        return validated;
    }
}
