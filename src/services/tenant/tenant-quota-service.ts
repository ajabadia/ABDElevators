import { getTenantCollection } from "@/lib/db-tenant";
import { TenantConfigService } from "./tenant-config-service";

export class TenantQuotaService {
    /**
     * Checks if a tenant has enough storage space.
     */
    static async hasStorageQuota(tenantId: string, bytesToUpload: number): Promise<boolean> {
        const config = await TenantConfigService.getConfig(tenantId);
        const session = { user: { id: 'system', tenantId, role: 'SYSTEM' } } as unknown as Parameters<typeof getTenantCollection>[1];
        const collection = await getTenantCollection('usage_logs', session);

        const usage = await collection.aggregate([
            { 
                $match: { 
                    $or: [
                        { type: 'STORAGE_BYTES' },
                        { tipo: 'STORAGE_BYTES' } // Legacy support
                    ]
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    total: { 
                        $sum: { $ifNull: ['$value', '$valor'] } // Legacy support
                    } 
                } 
            }
        ]).toArray();

        const currentUsage = usage[0]?.total || 0;
        return (currentUsage + bytesToUpload) <= (config.storage.quotaBytes || 0);
    }

    /**
     * Validates and returns Cloudinary prefix.
     */
    static async getCloudinaryPrefix(tenantId: string): Promise<string> {
        const config = await TenantConfigService.getConfig(tenantId);
        return config.storage.settings.folderPrefix || `abd-rag-platform/tenants/${tenantId}`;
    }
}
