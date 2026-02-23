import { AuditTrailService } from '@/services/observability/AuditTrailService';
import { logEvento } from '../logger';

export type PolicyAction =
    | 'AGENT_UPDATE_ENTITY'
    | 'AUTO_CREATE_TASK'
    | 'SENSITIVE_DATA_ACCESS'
    | 'USAGE_QUOTA_CHECK';

export interface PolicyContext {
    tenantId: string;
    userId?: string;
    actorType: 'USER' | 'IA' | 'SYSTEM';
    resource?: string;
    correlationId: string;
}

/**
 * PolicyService - Centraliza las decisiones de gobernanza técnica y cuotas.
 * Phase 132.4
 */
export class PolicyService {

    /**
     * Evalúa si una acción de IA requiere intervención humana (HITL).
     */
    static async evaluateAIAction(
        action: PolicyAction,
        confidence: number,
        context: PolicyContext
    ): Promise<{ approved: boolean; reason?: string; requiresHITL: boolean }> {
        // Regla base: confianza < 0.8 siempre requiere HITL
        const threshold = 0.85;
        const requiresHITL = confidence < threshold;

        await AuditTrailService.logAdminOp({
            actorType: context.actorType,
            actorId: context.userId || 'IA_AGENT',
            tenantId: context.tenantId,
            action: `GOVERNANCE_EVALUATION_${action}`,
            entityType: 'GOVERNANCE',
            entityId: context.resource || 'unknown',
            changes: { before: { confidence }, after: { approved: !requiresHITL, requiresHITL } },
            reason: `Evaluación de gobernanza para acción ${action}`,
            correlationId: context.correlationId
        } as any);

        return {
            approved: !requiresHITL,
            requiresHITL,
            reason: requiresHITL ? 'Confianza por debajo del umbral de seguridad' : undefined
        };
    }

    /**
     * Valida si un tenant tiene cuota disponible para un recurso.
     */
    static async validateQuotas(tenantId: string, resource: 'LLM_TOKENS' | 'STORAGE' | 'DOCUMENTS'): Promise<boolean> {
        // TODO: Integrar con UsageService cuando esté disponible
        // Por ahora es un pass-through seguro
        return true;
    }

    /**
     * Verifica la sensibilidad de los datos para un usuario.
     */
    static async isDataAccessAllowed(userId: string, sensitivityLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL'): Promise<boolean> {
        // TODO: Integrar con GuardianService roles
        if (sensitivityLevel === 'PUBLIC') return true;
        return true; // Fallback permisivo hasta integrar Guardian
    }
}
