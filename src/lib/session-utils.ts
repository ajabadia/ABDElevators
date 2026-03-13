
import { UserRole } from "@/types/roles";
import { TenantIdSchema, EntityIdSchema } from "@/lib/schemas";

/**
 * 🛡️ Genera una sesión de sistema para tareas de infraestructura, procesos de fondo o CRON.
 * Cumple con la Regla #11 de aislamiento multi-tenant al proporcionar un contexto de SuperAdmin.
 * 
 * @param rawTenantId - Tenant sobre el que operar (opcional, por defecto platform_master)
 * @returns TenantSession compatible con getTenantCollection
 */
export function getSystemSession(rawTenantId: string = '000000000000000000000000') {
    const DEFAULT_ID = '000000000000000000000000';
    
    const tenantIdParse = TenantIdSchema.safeParse(rawTenantId);
    const tenantId = tenantIdParse.success ? tenantIdParse.data : DEFAULT_ID;

    return {
        user: {
            id: EntityIdSchema.parse(DEFAULT_ID),
            tenantId,
            role: UserRole.SUPER_ADMIN
        }
    };
}
