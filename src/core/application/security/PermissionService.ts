import { UserRole } from '@/types/roles';
import { TenantTier, TierConfig } from '@/types/tiers';
import { AppPermission } from '@/types/permissions';
import { GuardianEngine, EvaluationUser } from '@/core/guardian/GuardianEngine';

export class PermissionService {
    private static tierConfigs: Record<TenantTier, TierConfig> = {
        [TenantTier.BASIC]: {
            tier: TenantTier.BASIC,
            defaultEntitlements: [
                { featureKey: 'rag.chat', allowed: true, limit: 100 },
                { featureKey: 'reports', allowed: true, limit: 5 },
                { featureKey: 'insights', allowed: false },
                { featureKey: 'predictive', allowed: false }
            ],
            defaultLimits: {
                tokensPerMonth: 500000,
                storageBytes: 100 * 1024 * 1024, // 100MB
                vectorSearchesPerMonth: 500,
                maxUsers: 3
            }
        },
        [TenantTier.PRO]: {
            tier: TenantTier.PRO,
            defaultEntitlements: [
                { featureKey: 'rag.chat', allowed: true },
                { featureKey: 'reports', allowed: true, limit: 500 },
                { featureKey: 'insights', allowed: true },
                { featureKey: 'predictive', allowed: true }
            ],
            defaultLimits: {
                tokensPerMonth: 5000000,
                storageBytes: 1024 * 1024 * 1024, // 1GB
                vectorSearchesPerMonth: 5000,
                maxUsers: 20
            }
        },
        [TenantTier.ENTERPRISE]: {
            tier: TenantTier.ENTERPRISE,
            defaultEntitlements: [
                { featureKey: 'rag.chat', allowed: true },
                { featureKey: 'reports', allowed: true },
                { featureKey: 'insights', allowed: true },
                { featureKey: 'predictive', allowed: true },
                { featureKey: 'sso', allowed: true },
                { featureKey: 'ai_governance', allowed: true }
            ],
            defaultLimits: {
                tokensPerMonth: 100000000,
                storageBytes: 100 * 1024 * 1024 * 1024, // 100GB
                vectorSearchesPerMonth: 1000000,
                maxUsers: 1000
            }
        }
    };

    /**
     * Revisa si un usuario tiene permiso para una acción específica.
     * Combina Tiers (Entitlements) + Roles + Políticas de Guardian.
     */
    static async can(
        user: { role: UserRole; tenantId: string; tier: TenantTier; permissionGroups?: string[]; permissionOverrides?: string[] },
        permission: AppPermission
    ): Promise<boolean> {
        // 1. Verificar Entitlement por Tier
        if (!this.checkTierEntitlement(user.tier, permission)) {
            return false;
        }

        // 2. Si es SUPER_ADMIN, bypass total
        if (user.role === UserRole.SUPER_ADMIN) {
            return true;
        }

        // 3. Evaluar mediante GuardianEngine (ABAC/Policies)
        const guardian = GuardianEngine.getInstance();
        const evalUser: EvaluationUser = {
            role: user.role,
            tenantId: user.tenantId,
            permissionGroups: user.permissionGroups,
            permissionOverrides: user.permissionOverrides
        };

        const result = await guardian.evaluate(evalUser, permission, 'execute');
        return result.allowed;
    }

    /**
     * Filtra los permisos que vienen "de serie" con cada Tier.
     */
    private static checkTierEntitlement(tier: TenantTier, permission: AppPermission): boolean {
        const config = this.tierConfigs[tier];
        if (!config) return false;

        // Mapeo de permisos a featureKeys de entitlements
        const permissionToFeatureMap: Partial<Record<AppPermission, string>> = {
            [AppPermission.INSIGHTS_VIEW]: 'insights',
            [AppPermission.PREDICTIVE_MAINTENANCE]: 'predictive',
            [AppPermission.REPORT_GENERATE]: 'reports',
            [AppPermission.AI_GOVERNANCE_VIEW]: 'ai_governance',
            [AppPermission.AI_GOVERNANCE_MANAGE]: 'ai_governance',
        };

        const featureKey = permissionToFeatureMap[permission];
        if (!featureKey) return true; // Si no está mapeado, se asume que el Tier no lo bloquea (lo bloquea el Rol)

        const entitlement = config.defaultEntitlements.find(e => e.featureKey === featureKey);
        return entitlement?.allowed ?? false;
    }

    static getTierConfig(tier: TenantTier): TierConfig {
        return this.tierConfigs[tier];
    }
}
