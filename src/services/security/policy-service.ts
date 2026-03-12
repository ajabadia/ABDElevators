import { AuditTrailService } from '@/services/observability/AuditTrailService';
import { logEvento } from '@/lib/logger';

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
            actorId: context.userId || '000000000000000000000000',
            tenantId: context.tenantId,
            action: `GOVERNANCE_EVALUATION_${action}`,
            entityType: 'GOVERNANCE',
            entityId: context.resource || '000000000000000000000000',
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
     * ⚡ FASE 304: Unified Policy Enforcement.
     */
    static async validateQuotas(
        tenantId: string,
        resource: 'TOKENS' | 'STORAGE' | 'SEARCHES' | 'USERS' | 'API_REQUEST'
    ): Promise<boolean> {
        try {
            const { QuotaService } = await import('./quota-service');
            const result = await QuotaService.evaluateQuota(tenantId, resource);

            if (result.status === 'BLOCKED') {
                await logEvento({
                    level: 'WARN',
                    source: 'POLICY_SERVICE',
                    action: 'QUOTA_BLOCK',
                    message: `Cuota bloqueada para ${tenantId} (${resource}): ${result.reason}`,
                    tenantId,
                    details: { resource, reason: result.reason }
                });
                return false;
            }

            return true;
        } catch (error) {
            console.error('[PolicyService] Quota validation failed:', error);
            return false; // Fail-closed
        }
    }

    /**
     * Verifica la sensibilidad de los datos y registra el acceso.
     * ⚡ FASE 304: Bank-grade data access auditing.
     */
    static async isDataAccessAllowed(
        context: PolicyContext,
        sensitivityLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'PII'
    ): Promise<boolean> {
        // Log access attempt (Audit Trail)
        await AuditTrailService.logDataAccess({
            actorId: context.userId || '000000000000000000000000',
            actorType: context.actorType,
            tenantId: context.tenantId,
            action: 'SENSITIVE_DATA_ACCESS',
            entityType: 'DATA',
            entityId: context.resource || '000000000000000000000000',
            reason: `Nivel de sensibilidad solicitado: ${sensitivityLevel}`,
            correlationId: context.correlationId
        } as any);

        // Simple role-based logic (to be expanded with Guardian V3)
        if (sensitivityLevel === 'PUBLIC') return true;

        // For experimental Phase 304, we assume internal system actors can access
        if (context.actorType === 'SYSTEM' || context.actorType === 'IA') return true;

        return true; // Provisional: permitir hasta integración completa con Guardian
    }
}
