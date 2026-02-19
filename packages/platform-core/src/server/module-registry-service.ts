import { Document } from 'mongodb';
import { getTenantCollection, TenantSession } from './db-tenant';
import { logEvento } from './logger';
import {
    PlatformModule,
    ModuleLicense,
    ModuleLicenseSchema,
    LICENSE_TIERS
} from '../types/module-registry';
import { AppError } from '../errors';

/**
 * ModuleRegistryService
 * Handles platform feature licensing and tier management.
 */
export class ModuleRegistryService {

    /**
     * Check if a specific module is licensed for a tenant.
     */
    static async isModuleEnabled(session: TenantSession, module: PlatformModule): Promise<boolean> {
        const license = await this.getTenantLicense(session);

        // ENTERPRISE tier has access to all modules by default unless restricted
        if (license.tier === 'ENTERPRISE') return true;

        return license.enabledModules.includes(module);
    }

    /**
     * Get the current license for a tenant.
     */
    static async getTenantLicense(session: TenantSession): Promise<ModuleLicense> {
        const tenantId = session.user?.tenantId || 'platform_master';
        const collection = await getTenantCollection<Document>('module_licenses', session, 'LOGS');

        const doc = await collection.findOne({ tenantId });

        if (!doc) {
            // Default FREE license for new tenants
            return {
                tenantId,
                tier: 'FREE',
                enabledModules: ['RAG'], // Only RAG enabled for FREE
                limits: {
                    REPORTS_PER_MONTH: 5,
                    TOKENS_PER_DAY: 10000
                }
            };
        }

        return ModuleLicenseSchema.parse(doc);
    }

    /**
     * Assign or update a license for a tenant (SUPER_ADMIN only).
     */
    static async assignLicense(
        session: TenantSession,
        targetTenantId: string,
        licenseData: Partial<Omit<ModuleLicense, 'tenantId'>>
    ): Promise<void> {
        if (session.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('FORBIDDEN', 403, 'Solo SUPER_ADMIN puede gestionar licencias');
        }

        const collection = await getTenantCollection<Document>('module_licenses', session, 'LOGS');

        const updateDoc = {
            ...licenseData,
            tenantId: targetTenantId,
            updatedAt: new Date()
        };

        await collection.updateOne(
            { tenantId: targetTenantId },
            { $set: updateDoc },
            { upsert: true }
        );

        await logEvento({
            level: 'INFO',
            source: 'MODULE_REGISTRY_SERVICE',
            action: 'LICENSE_UPDATED',
            message: `License updated for tenant ${targetTenantId}: Tier ${licenseData.tier}`,
            tenantId: session.user.tenantId,
            correlationId: `license-upd-${Date.now()}`,
            details: { targetTenantId, tier: licenseData.tier }
        });
    }

    /**
     * Validate if a tenant has reached a specific usage limit.
     */
    static async checkLimit(session: TenantSession, limitKey: string, currentUsage: number): Promise<void> {
        const license = await this.getTenantLicense(session);
        const limitValue = license.limits?.[limitKey];

        if (limitValue !== undefined && currentUsage >= limitValue) {
            throw new AppError('LIMIT_EXCEEDED', 429, `Has alcanzado el límite de ${limitKey} para tu plan ${license.tier}`);
        }
    }
}
