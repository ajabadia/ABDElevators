import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { PlanTier } from '@/lib/plans';
import { logEvento } from '@/lib/logger';
import { QuotaService } from '@/lib/quota-service';
import { LimitAlertService } from '@/services/security/limit-alert-service';

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
 * Verifica si un tenant puede consumir tokens de LLM
 */
export async function checkLLMLimit(
    tenantId: string,
    tokensToConsume: number,
    tier?: PlanTier
): Promise<UsageLimitCheck> {
    const check = await QuotaService.evaluateQuota(tenantId, 'TOKENS', tokensToConsume);

    // Enviar notificación si es necesario (vía LimitAlertService)
    if (check.percentage >= 80) {
        await LimitAlertService.sendLimitNotificationIfNeeded({
            tenantId,
            resourceType: 'tokens',
            currentUsage: check.current,
            limit: check.limit,
            percentage: check.percentage,
            tier: tier || 'FREE'
        });
    }

    return {
        allowed: check.status !== 'BLOCKED',
        reason: check.reason,
        current: check.current,
        limit: check.limit,
        percentage: check.percentage,
    };
}

/**
 * Verifica si un tenant puede realizar búsquedas vectoriales
 */
export async function checkVectorSearchLimit(
    tenantId: string,
    tier?: PlanTier
): Promise<UsageLimitCheck> {
    const check = await QuotaService.evaluateQuota(tenantId, 'SEARCHES', 1);

    return {
        allowed: check.status !== 'BLOCKED',
        reason: check.reason,
        current: check.current,
        limit: check.limit,
        percentage: check.percentage,
    };
}

/**
 * Verifica si un tenant puede hacer una llamada API
 */
export async function checkAPIRequestLimit(
    tenantId: string,
    tier?: PlanTier
): Promise<UsageLimitCheck> {
    const check = await QuotaService.evaluateQuota(tenantId, 'API_REQUEST', 1);

    return {
        allowed: check.status !== 'BLOCKED',
        reason: check.reason,
        current: check.current,
        limit: check.limit,
        percentage: check.percentage,
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
            level: check.percentage >= 200 ? 'ERROR' : 'WARN',
            source: 'USAGE_LIMITER',
            action: 'LIMIT_EXCEEDED',
            message: `Tenant ${tenantId} (${type}): ${check.reason}`,
            correlationId: `limit-${tenantId}`,
            details: { type, current: check.current, limit: check.limit, status: check.allowed ? 'OVERAGE' : 'BLOCKED' },
        });

        if (check.percentage >= 200 || check.reason?.includes('gratuito')) {
            throw new AppError(
                'STORAGE_QUOTA_EXCEEDED',
                429,
                check.reason || 'Límite de consumo excedido. Por favor, actualiza tu plan.'
            );
        }
    }
}
