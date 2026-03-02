import { UsageService } from '@/services/ops/usage-service';
import { TenantService } from '@/services/tenant/tenant-service';
import { PLANS, PlanTier } from '@/lib/plans';
import { ObjectId, ClientSession } from 'mongodb';
import { ValidationError, AppError } from '@/lib/errors';
import { billingRepository } from '@/lib/repositories/BillingRepository';
import { TenantSubscriptionSchema, TenantSubscription } from '@/lib/schemas/billing';
import { logEvento } from '@/lib/logger';
import { stripe, createCheckoutSession } from '@/lib/stripe';
import Stripe from 'stripe';
import { EmailService } from '@/services/infra/EmailService';

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
 * Hardened Era 8: Repository-based access and zero :any.
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
            const customerId = config.subscription?.stripeCustomerId || undefined;

            const session = await createCheckoutSession({
                tenantId,
                tier: tier as 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE',
                customerId,
                successUrl: `${process.env.NEXTAUTH_URL}/admin/billing/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${process.env.NEXT_URL}/admin/billing/plan`,
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
    static async handleWebhookEvent(event: Stripe.Event, session?: ClientSession): Promise<void> {
        const correlationId = crypto.randomUUID();

        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, correlationId, session);
                    break;
                case 'invoice.paid':
                    await this.handleInvoicePaid(event.data.object as Stripe.Invoice, correlationId, session);
                    break;
                case 'invoice.payment_failed':
                    await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, correlationId, session);
                    break;
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription, correlationId, session);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription, correlationId, session);
                    break;
                default:
                    break;
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await logEvento({
                level: 'ERROR',
                source: 'BILLING_SERVICE',
                action: 'WEBHOOK_PROCESS_ERROR',
                correlationId,
                message: errorMessage,
                details: { eventType: event.type }
            });
            throw error;
        }
    }

    private static async handleCheckoutCompleted(session: Stripe.Checkout.Session, correlationId: string, dbSession?: ClientSession): Promise<void> {
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
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId, session: dbSession });

        await logEvento({
            level: 'INFO',
            source: 'BILLING_SERVICE',
            action: 'SUBSCRIPTION_ACTIVATED',
            correlationId,
            message: `Subscription activated for tenant ${tenantId}`,
            details: { tenantId, subscriptionId: session.subscription }
        });
    }

    private static async handleInvoicePaid(invoice: Stripe.Invoice, correlationId: string, dbSession?: ClientSession): Promise<void> {
        const inv = invoice as unknown as { subscription: string | { id: string } | null };
        const subscriptionId = typeof inv.subscription === 'string'
            ? inv.subscription
            : inv.subscription?.id;

        if (!subscriptionId) return;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const sub = subscription as unknown as { metadata?: Record<string, string>; current_period_end: number };

        const tenantId = sub.metadata?.tenantId;
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

        const currentPeriodEnd = new Date(sub.current_period_end * 1000);
        await TenantService.updateConfig(tenantId, {
            'subscription.status': 'active',
            'subscription.currentPeriodEnd': currentPeriodEnd,
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId, session: dbSession });
    }

    private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice, correlationId: string, dbSession?: ClientSession): Promise<void> {
        const inv = invoice as unknown as { subscription: string | { id: string } | null; customer: string | { id: string } | null };
        const subscriptionId = typeof inv.subscription === 'string'
            ? inv.subscription
            : inv.subscription?.id;

        if (!subscriptionId) return;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const sub = subscription as unknown as { metadata?: Record<string, string> };
        const tenantId = sub.metadata?.tenantId;
        if (!tenantId) {
            const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id || '';
            await logEvento({
                level: 'WARN',
                source: 'BILLING_SERVICE',
                action: 'PAYMENT_FAILED_NO_TENANT',
                correlationId,
                message: `Payment failed for unknown tenant (Customer: ${customerId})`,
                details: { invoiceId: invoice.id }
            });
            return;
        }

        // 1. Update status to past_due
        await TenantService.updateConfig(tenantId, {
            'subscription.status': 'past_due',
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId, session: dbSession });

        // 2. Business Logic: Email and Suspension
        try {
            const tenant = await TenantService.getConfig(tenantId);
            const { UserService } = await import('@/services/auth/UserService');
            const adminsResult = await UserService.list({ tenantId, role: 'ADMIN' });
            const admins = adminsResult.users;

            if (admins.length > 0 && admins[0].email) {
                await EmailService.sendPaymentFailedEmail({
                    to: admins[0].email,
                    tenantName: tenant.name || 'Tu Organización',
                    amount: invoice.amount_due / 100,
                    currency: invoice.currency,
                    attemptCount: (invoice as unknown as { attempt_count?: number }).attempt_count || 1,
                });
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await logEvento({
                level: 'ERROR',
                source: 'BILLING_SERVICE',
                action: 'PAYMENT_FAILED_LOGIC_ERROR',
                correlationId,
                message: `Error in payment failed logic: ${errorMessage}`,
                details: { tenantId }
            });
        }

        await logEvento({
            level: 'WARN',
            source: 'BILLING_SERVICE',
            action: 'PAYMENT_FAILED',
            correlationId,
            message: `Payment failed for tenant ${tenantId}`,
            details: { invoiceId: invoice.id, tenantId }
        });
    }

    private static async handleSubscriptionUpdated(subscription: Stripe.Subscription, correlationId: string, dbSession?: ClientSession): Promise<void> {
        const tenantId = subscription.metadata?.tenantId;
        if (!tenantId) return;

        // Map Price ID to Plan Tier
        const priceId = subscription.items.data[0].price.id;
        const tier = Object.values(PLANS).find(p => p.stripePriceId === priceId)?.tier || 'FREE';

        const sub = subscription as unknown as { current_period_end: number };
        await TenantService.updateConfig(tenantId, {
            'subscription.planSlug': tier,
            'subscription.status': subscription.status as 'active',
            'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId, session: dbSession });

        await logEvento({
            level: 'INFO',
            source: 'BILLING_SERVICE',
            action: 'SUBSCRIPTION_UPDATED',
            correlationId,
            message: `Subscription updated for tenant ${tenantId} to ${tier}`,
            details: { tenantId, tier, status: subscription.status }
        });
    }

    private static async handleSubscriptionDeleted(subscription: Stripe.Subscription, correlationId: string, dbSession?: ClientSession): Promise<void> {
        const tenantId = subscription.metadata?.tenantId;
        if (!tenantId) return;

        await TenantService.updateConfig(tenantId, {
            'subscription.status': 'canceled',
            'subscription.updatedAt': new Date()
        }, { performedBy: 'STRIPE_WEBHOOK', correlationId, session: dbSession });

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
        const customLimits = (config as unknown as { customLimits?: TenantConfigCustomLimits }).customLimits || {};

        if (metric === 'TOKENS') {
            limit = customLimits.llm_tokens_per_month ?? plan.limits.llm_tokens_per_month;
            const aggregate = await UsageService.getAggregateUsage(tenantId, new Date(new Date().setDate(1)), new Date());
            usage = (aggregate['LLM_TOKENS'] as number) || 0;
        } else if (metric === 'STORAGE') {
            const configStorage = config.storage as unknown as { quota_bytes?: number } | undefined;
            limit = customLimits.storage_bytes ?? (configStorage?.quota_bytes || plan.limits.storage_bytes || 0);
            const aggregate = await UsageService.getAggregateUsage(tenantId, new Date(new Date().setDate(1)), new Date());
            usage = (aggregate['STORAGE_BYTES'] as number) || 0;
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
        const tier = newPlanSlug.toUpperCase() as PlanTier;

        if (!(tier in PLANS)) {
            throw new ValidationError(`Plan inválido: ${newPlanSlug}. Planes válidos: ${Object.keys(PLANS).join(', ')}`);
        }

        const currentConfig = await TenantService.getConfig(tenantId);
        const correlationId = crypto.randomUUID();

        const newSubscription: Partial<TenantSubscription> = {
            planSlug: tier,
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
        };

        await TenantService.updateConfig(tenantId, {
            subscription: {
                ...currentConfig.subscription,
                ...newSubscription
            }
        }, {
            performedBy: 'system-billing',
            correlationId
        });

        const { AuditTrailService } = await import('@/services/observability/AuditTrailService');
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
        });

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
        const sub = config.subscription;

        if (!sub?.stripeCustomerId || !sub?.stripeSubscriptionId) {
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

        const { getUpcomingInvoice } = await import('@/lib/stripe');
        const invoicePreview = await getUpcomingInvoice(
            sub.stripeCustomerId,
            sub.stripeSubscriptionId,
            targetPriceId
        );

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
            currency: (invoicePreview as unknown as { currency: string }).currency.toUpperCase(),
            nextBillingDate: new Date((invoicePreview.next_payment_attempt || Date.now() / 1000) * 1000)
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
        const tokensUsed = (usage['LLM_TOKENS'] as number) || 0;

        const lineItems: InvoiceLineItem[] = [];

        if (plan.price_monthly > 0) {
            lineItems.push({
                description: `Suscripción Mensual - Plan ${plan.name}`,
                quantity: 1,
                unitPrice: plan.price_monthly,
                total: plan.price_monthly
            });
        }

        if (plan.overage.tokens > 0) {
            const customLimits = (tenantConfig as unknown as { customLimits?: TenantConfigCustomLimits }).customLimits || {};
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
                fiscalName: (tenantConfig.billing as unknown as BillingFiscalData)?.fiscalName,
                taxId: (tenantConfig.billing as unknown as BillingFiscalData)?.taxId,
                address: (tenantConfig.billing as unknown as BillingFiscalData)?.billingAddress?.line1
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
            billing: billingData as any
        });
    }

    // ── Seed Plans ─────────────────────────────────────────────────────────

    /**
     * Seeds the billing plans into the database.
     */
    static async seedDefaultPlans(): Promise<unknown> {
        const { connectDB } = await import('@/lib/db');
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
        const tenant = await TenantService.getConfig(tenantId);
        const currentSub = tenant.subscription || { planSlug: 'FREE' as const, status: 'trial' as const };

        const newSubData: TenantSubscription = {
            ...currentSub,
            ...data,
            updatedAt: new Date(),
            createdAt: (currentSub as unknown as { createdAt?: Date }).createdAt || new Date()
        } as TenantSubscription;

        const validated = TenantSubscriptionSchema.parse(newSubData);

        await TenantService.updateConfig(tenantId, {
            subscription: validated
        });

        const correlationId = crypto.randomUUID();

        const { AuditTrailService } = await import('@/services/observability/AuditTrailService');
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
        });

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
