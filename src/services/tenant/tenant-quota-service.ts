import { getTenantCollection } from "@/lib/db-tenant";
import { TenantConfigService } from "./tenant-config-service";

export class TenantQuotaService {
    /**
     * Checks if a tenant has enough storage space.
     */
    static async hasStorageQuota(tenantId: string, bytesToUpload: number): Promise<boolean> {
        const config = await TenantConfigService.getConfig(tenantId);
        const session = { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any;
        const collection = await getTenantCollection('usage_logs', session);

        const usage = await collection.aggregate([
            { $match: { tipo: 'STORAGE_BYTES' } },
            { $group: { _id: null, total: { $sum: '$valor' } } }
        ]).toArray();

        const currentUsage = usage[0]?.total || 0;
        return (currentUsage + bytesToUpload) <= config.storage.quota_bytes;
    }

    /**
     * Validates and returns Cloudinary prefix.
     */
    static async getCloudinaryPrefix(tenantId: string): Promise<string> {
        const config = await TenantConfigService.getConfig(tenantId);
        return config.storage.settings.folder_prefix || `abd-rag-platform/tenants/${tenantId}`;
    }
}
