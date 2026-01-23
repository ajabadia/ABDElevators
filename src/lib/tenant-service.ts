import { connectDB } from "./db";
import { TenantConfigSchema } from "./schemas";
import { AppError, NotFoundError } from "./errors";
import { logEvento } from "./logger";

/**
 * Servicio para gestionar la configuración de Tenants (Aislamiento y Multi-tenant)
 */
export class TenantService {
    /**
     * Obtiene la configuración de un tenant por su ID único
     */
    static async getConfig(tenantId: string) {
        try {
            const db = await connectDB();
            const config = await db.collection('tenants').findOne({ tenantId });

            if (!config) {
                // Fallback a configuración default si no existe (bootstrap)
                return {
                    tenantId,
                    name: 'Default Organization',
                    industry: 'GENERIC' as const,
                    storage: {
                        provider: 'cloudinary' as const,
                        settings: {
                            folder_prefix: 'abd-rag-platform/default'
                        },
                        quota_bytes: 50 * 1024 * 1024 // 50MB trial
                    },
                    subscription: {
                        tier: 'FREE' as const,
                        status: 'ACTIVE' as const,
                    },
                    active: true,
                    creado: new Date(),
                };
            }


            return TenantConfigSchema.parse(config);
        } catch (error) {
            console.error(`Error fetching tenant config for ${tenantId}:`, error);
            throw new AppError('TENANT_CONFIG_ERROR', 500, 'Error al recuperar configuración del tenant');
        }
    }

    /**
     * Verifica si un tenant tiene espacio disponible para subir un archivo
     */
    static async hasStorageQuota(tenantId: string, bytesToUpload: number): Promise<boolean> {
        const config = await this.getConfig(tenantId);
        const db = await connectDB();

        // Sumar todo el almacenamiento registrado en UsageLog
        const usage = await db.collection('usage_logs').aggregate([
            { $match: { tenantId, tipo: 'STORAGE_BYTES' } },
            { $group: { _id: null, total: { $sum: '$valor' } } }
        ]).toArray();

        const currentUsage = usage[0]?.total || 0;
        return (currentUsage + bytesToUpload) <= config.storage.quota_bytes;
    }

    /**
     * Obtiene todos los tenants (solo para super-admin)
     */
    static async getAllTenants() {
        const db = await connectDB();
        return await db.collection('tenants').find({}).toArray();
    }

    /**
     * Actualiza o crea la configuración de un tenant
     */
    static async updateConfig(tenantId: string, data: any) {
        try {
            const db = await connectDB();
            const validated = TenantConfigSchema.parse({ ...data, tenantId });

            await db.collection('tenants').updateOne(
                { tenantId },
                { $set: { ...validated, actualizado: new Date() } },
                { upsert: true }
            );

            await logEvento({
                nivel: 'INFO',
                origen: 'TENANT_SERVICE',
                accion: 'UPDATE_CONFIG',
                mensaje: `Configuración actualizada para tenant: ${tenantId}`,
                correlacion_id: `system-${tenantId}`,
                detalles: { tenantId }
            });

            return validated;
        } catch (error) {
            if (error instanceof Error) {
                throw new AppError('TENANT_CONFIG_ERROR', 400, `Error validando configuración: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Obtiene el prefijo de carpeta para Cloudinary según el tenant
     */
    static async getCloudinaryPrefix(tenantId: string): Promise<string> {
        const config = await this.getConfig(tenantId);
        return config.storage.settings.folder_prefix || `abd-rag-platform/tenants/${tenantId}`;
    }
}
