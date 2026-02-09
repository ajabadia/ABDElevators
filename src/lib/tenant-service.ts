import { connectAuthDB } from "./db";
import { TenantConfigSchema } from "./schemas";
import { AppError, NotFoundError } from "./errors";
import { logEvento } from "./logger";
import crypto from 'crypto';

/**
 * Servicio para gestionar la configuración de Tenants (Aislamiento y Multi-tenant)
 */
export class TenantService {
    // Cache en memoria para evitar llamadas excesivas a DB (Branding, Cuotas, etc)
    private static cache = new Map<string, { data: any, timestamp: number }>();
    private static CACHE_TTL = 5 * 60 * 1000; // 5 minutos

    /**
     * Obtiene la configuración de un tenant por su ID único
     */
    static async getConfig(tenantId: string) {
        // Log para ver cuándo se pide configuración
        const correlationId = `sys-get-config-${tenantId}-${Date.now()}`;

        // 1. Verificar cache
        // const cached = this.cache.get(tenantId);
        // if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
        //     return cached.data;
        // }

        try {
            const db = await connectAuthDB();
            const config = await db.collection('tenants').findOne({ tenantId });

            if (!config) {
                throw new NotFoundError(`Tenant config not found for ID: ${tenantId}`);
            }

            // Log de lo que hay en DB antes de Zod
            await logEvento({
                level: 'DEBUG',
                source: 'TENANT_SERVICE',
                action: 'GET_CONFIG_DB_RAW',
                correlationId,
                message: `Datos brutos de DB para tenant: ${tenantId}`,
                details: {
                    tenantId,
                    hasBranding: !!config.branding,
                    primaryColor: config.branding?.colors?.primary,
                    accentColor: config.branding?.colors?.accent
                }
            });

            const validated = TenantConfigSchema.parse(config);

            // Guardar en cache
            this.cache.set(tenantId, { data: validated, timestamp: Date.now() });

            return validated;
        } catch (error: any) {
            if (error instanceof NotFoundError) throw error;

            await logEvento({
                level: 'ERROR',
                source: 'TENANT_SERVICE',
                action: 'GET_CONFIG_ERROR',
                message: error.message || 'Error fetching tenant config',
                correlationId: `sys-tenant-${tenantId}`,
                details: {
                    tenantId,
                    isZodError: error.name === 'ZodError',
                    zodIssues: error.name === 'ZodError' ? error.issues : undefined
                },
                stack: error.stack
            });

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
     * Actualiza la configuración de un tenant
     * @returns La configuración actualizada y validada
     */
    static async updateConfig(tenantId: string, data: any, metadata?: { performedBy: string, correlationId?: string }): Promise<any> {
        const correlationId = metadata?.correlationId || crypto.randomUUID();

        // Log inicio
        await logEvento({
            level: 'INFO',
            source: 'TENANT_SERVICE',
            action: 'UPDATE_CONFIG_START',
            correlationId,
            message: `Updating config for tenant: ${tenantId}`,
            details: { keys: Object.keys(data) }
        });

        try {
            // 1. Validar actualización parcial
            const validated = TenantConfigSchema.partial().parse(data);

            const db = await connectAuthDB();

            // 2. Audit Snapshot Previous
            const previousState = await db.collection('tenants').findOne({ tenantId });

            // 3. Persistir
            const { _id, tenantId: _ign, ...updateData } = validated as any;

            await db.collection('tenants').updateOne(
                { tenantId },
                {
                    $set: {
                        ...updateData,
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );

            // 4. Invalidate Cache
            this.cache.delete(tenantId);

            // 5. Audit Snapshot New
            await db.collection('tenant_configs_history').insertOne({
                tenantId,
                correlationId,
                previousState,
                newState: validated,
                performedBy: metadata?.performedBy || 'SYSTEM',
                timestamp: new Date()
            });

            // Log éxito
            await logEvento({
                level: 'INFO',
                source: 'TENANT_SERVICE',
                action: 'UPDATE_CONFIG_SUCCESS',
                correlationId,
                message: `Config updated successfully`,
                details: { branding: updateData.branding }
            });

            return validated;
        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'TENANT_SERVICE',
                action: 'UPDATE_CONFIG_ERROR',
                correlationId,
                message: error.message,
                details: { stack: error.stack }
            });
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
