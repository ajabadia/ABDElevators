import { connectAuthDB } from "./db";
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
            const db = await connectAuthDB();
            const config = await db.collection('tenants').findOne({ tenantId });
            // ... (rest of the file using connectAuthDB)

            if (!config) {
                throw new NotFoundError(`Tenant config not found for ID: ${tenantId}`);
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
        const db = await connectAuthDB();

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
        const db = await connectAuthDB();
        return await db.collection('tenants').find({}).toArray();
    }

    /**
     * Actualiza o crea la configuración de un tenant e inserta registro en auditoría.
     */
    static async updateConfig(tenantId: string, data: any, metadata?: { performedBy: string, correlacion_id?: string }) {
        try {
            const db = await connectAuthDB();

            // 1. Obtener estado previo para auditoría
            const previousState = await db.collection('tenants').findOne({ tenantId });

            // 2. Validar nuevo estado
            const validated = TenantConfigSchema.parse({ ...data, tenantId });

            // 3. Persistir cambio
            await db.collection('tenants').updateOne(
                { tenantId },
                { $set: { ...validated, actualizado: new Date() } },
                { upsert: true }
            );

            // 4. Registrar en Historial (Grado Bancario)
            if (metadata) {
                // Detectar acción predominante si es posible, sino UPDATE_GENERAL
                let action: 'CREATE' | 'UPDATE_GENERAL' | 'UPDATE_BILLING' | 'UPDATE_STORAGE' = 'UPDATE_GENERAL';
                if (!previousState) action = 'CREATE';
                else if (JSON.stringify(previousState.billing) !== JSON.stringify(validated.billing)) action = 'UPDATE_BILLING';
                else if (JSON.stringify(previousState.storage) !== JSON.stringify(validated.storage)) action = 'UPDATE_STORAGE';

                await db.collection('tenant_configs_history').insertOne({
                    tenantId,
                    action,
                    previousState,
                    newState: validated,
                    performedBy: metadata.performedBy,
                    correlacion_id: metadata.correlacion_id || `sys-${Date.now()}`,
                    timestamp: new Date()
                });
            }

            // 5. Log de evento estándar
            await logEvento({
                nivel: 'INFO',
                origen: 'TENANT_SERVICE',
                accion: 'UPDATE_CONFIG',
                mensaje: `Configuración actualizada para tenant: ${tenantId}`,
                correlacion_id: metadata?.correlacion_id || `system-${tenantId}`,
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
