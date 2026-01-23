import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { getPlanForTenant, hasExceededLimit, PlanTier } from '@/lib/plans';
import { logEvento } from '@/lib/logger';
import { sendLimitAlert } from '@/lib/email-service';
import { TenantService } from '@/lib/tenant-service';
import { connectDB } from '@/lib/db';

/**
 * Middleware de Límites de Consumo (Fase 9)
 * Verifica si un tenant ha excedido sus límites antes de procesar requests.
 */

export interface UsageLimitCheck {
    allowed: boolean;
    reason?: string;
    current: number;
    limit: number;
    percentage: number;
}

/**
 * Helper para enviar notificación de límite si es necesario
 */
async function sendLimitNotificationIfNeeded(
    tenantId: string,
    resourceType: 'tokens' | 'storage' | 'searches' | 'api_requests',
    currentUsage: number,
    limit: number,
    percentage: number,
    tier: string
): Promise<void> {
    // Solo enviar notificación al 80% o 100%
    if (percentage < 80) return;

    try {
        // Obtener email del admin del tenant
        const db = await connectDB();
        const tenant = await db.collection('tenants').findOne({ tenantId });

        if (!tenant) return;

        // Buscar admin del tenant
        const admin = await db.collection('users').findOne({
            tenantId,
            role: 'ADMIN'
        });

        if (!admin?.email) return;

        // Verificar si ya se envió notificación recientemente (evitar spam)
        const lastNotification = await db.collection('email_notifications').findOne({
            tenantId,
            resourceType,
            percentage: percentage >= 100 ? 100 : 80,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24h
        });

        if (lastNotification) return; // Ya se envió notificación

        // Enviar email
        await sendLimitAlert({
            to: admin.email,
            tenantName: tenant.name || 'Tu Organización',
            resourceType,
            currentUsage,
            limit,
            percentage,
            tier,
        });

        // Registrar que se envió la notificación
        await db.collection('email_notifications').insertOne({
            tenantId,
            resourceType,
            percentage: percentage >= 100 ? 100 : 80,
            sentTo: admin.email,
            createdAt: new Date(),
        });

        await logEvento({
            nivel: 'INFO',
            origen: 'USAGE_LIMITER',
            accion: 'EMAIL_SENT',
            mensaje: `Email de alerta enviado a ${admin.email} (${percentage.toFixed(1)}% de ${resourceType})`,
            correlacion_id: `email-${tenantId}`,
            detalles: { resourceType, percentage, to: admin.email },
        });
    } catch (error) {
        // No bloquear la ejecución si falla el email
        await logEvento({
            nivel: 'ERROR',
            origen: 'USAGE_LIMITER',
            accion: 'EMAIL_FAILED',
            mensaje: `Error enviando email de alerta: ${(error as Error).message}`,
            correlacion_id: `email-error-${tenantId}`,
            stack: (error as Error).stack,
        });
    }
}

/**
 * Verifica si un tenant puede consumir tokens de LLM
 */
export async function checkLLMLimit(
    tenantId: string,
    tokensToConsume: number,
    tier?: PlanTier
): Promise<UsageLimitCheck> {
    const plan = getPlanForTenant(tier);
    const { collection } = await getTenantCollection('usage_logs');

    // Obtener consumo del mes actual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await collection.aggregate([
        {
            $match: {
                tenantId,
                tipo: 'LLM_TOKENS',
                timestamp: { $gte: startOfMonth },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$valor' },
            },
        },
    ]).toArray();

    const currentUsage = usage[0]?.total || 0;
    const futureUsage = currentUsage + tokensToConsume;
    const { exceeded, percentage } = hasExceededLimit(futureUsage, plan.limits.llm_tokens_per_month);

    // Enviar notificación si es necesario (80% o 100%)
    if (percentage >= 80) {
        await sendLimitNotificationIfNeeded(
            tenantId,
            'tokens',
            currentUsage,
            plan.limits.llm_tokens_per_month,
            percentage,
            plan.tier
        );
    }

    // Log de advertencia al 80%
    if (percentage >= 80 && percentage < 100) {
        await logEvento({
            nivel: 'WARN',
            origen: 'USAGE_LIMITER',
            accion: 'APPROACHING_LIMIT',
            mensaje: `Tenant ${tenantId} ha alcanzado el ${percentage.toFixed(1)}% de su límite de tokens LLM`,
            correlacion_id: `limit-check-${tenantId}`,
            detalles: { currentUsage, limit: plan.limits.llm_tokens_per_month, tier: plan.tier },
        });
    }

    return {
        allowed: !exceeded,
        reason: exceeded ? `Límite de tokens LLM excedido (${plan.limits.llm_tokens_per_month.toLocaleString()} tokens/mes)` : undefined,
        current: currentUsage,
        limit: plan.limits.llm_tokens_per_month,
        percentage,
    };
}

/**
 * Verifica si un tenant puede realizar búsquedas vectoriales
 */
export async function checkVectorSearchLimit(
    tenantId: string,
    tier?: PlanTier
): Promise<UsageLimitCheck> {
    const plan = getPlanForTenant(tier);
    const { collection } = await getTenantCollection('usage_logs');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await collection.aggregate([
        {
            $match: {
                tenantId,
                tipo: 'VECTOR_SEARCH',
                timestamp: { $gte: startOfMonth },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$valor' },
            },
        },
    ]).toArray();

    const currentUsage = usage[0]?.total || 0;
    const futureUsage = currentUsage + 1;
    const { exceeded, percentage } = hasExceededLimit(futureUsage, plan.limits.vector_searches_per_month);

    return {
        allowed: !exceeded,
        reason: exceeded ? `Límite de búsquedas vectoriales excedido (${plan.limits.vector_searches_per_month.toLocaleString()} búsquedas/mes)` : undefined,
        current: currentUsage,
        limit: plan.limits.vector_searches_per_month,
        percentage,
    };
}

/**
 * Verifica si un tenant puede hacer una llamada API
 */
export async function checkAPIRequestLimit(
    tenantId: string,
    tier?: PlanTier
): Promise<UsageLimitCheck> {
    const plan = getPlanForTenant(tier);
    const { collection } = await getTenantCollection('usage_logs');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await collection.aggregate([
        {
            $match: {
                tenantId,
                tipo: 'API_REQUEST',
                timestamp: { $gte: startOfMonth },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$valor' },
            },
        },
    ]).toArray();

    const currentUsage = usage[0]?.total || 0;
    const futureUsage = currentUsage + 1;
    const { exceeded, percentage } = hasExceededLimit(futureUsage, plan.limits.api_requests_per_month);

    return {
        allowed: !exceeded,
        reason: exceeded ? `Límite de llamadas API excedido (${plan.limits.api_requests_per_month.toLocaleString()} requests/mes)` : undefined,
        current: currentUsage,
        limit: plan.limits.api_requests_per_month,
        percentage,
    };
}

/**
 * Middleware helper para validar límites en API routes
 */
export async function enforceLimits(
    tenantId: string,
    tier: PlanTier | undefined,
    type: 'LLM' | 'VECTOR_SEARCH' | 'API_REQUEST',
    tokensToConsume?: number
): Promise<void> {
    let check: UsageLimitCheck;

    switch (type) {
        case 'LLM':
            check = await checkLLMLimit(tenantId, tokensToConsume || 0, tier);
            break;
        case 'VECTOR_SEARCH':
            check = await checkVectorSearchLimit(tenantId, tier);
            break;
        case 'API_REQUEST':
            check = await checkAPIRequestLimit(tenantId, tier);
            break;
    }

    if (!check.allowed) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'USAGE_LIMITER',
            accion: 'LIMIT_EXCEEDED',
            mensaje: `Tenant ${tenantId} bloqueado: ${check.reason}`,
            correlacion_id: `limit-block-${tenantId}`,
            detalles: { type, current: check.current, limit: check.limit },
        });

        throw new AppError(
            'STORAGE_QUOTA_EXCEEDED',
            429,
            check.reason || 'Límite de consumo excedido. Por favor, actualiza tu plan.'
        );
    }
}
