import { EntityIdSchema, TenantIdSchema } from "@/lib/schemas";
import { UserRole } from "@/types/roles";
import type { TenantSession } from "@/lib/db-tenant";

/**
 * 🆔 ID estandarizado para usuarios de sistema.
 */
export const SYSTEM_USER_ID = '000000000000000000000000';

/**
 * 🛡️ Genera una sesión de SuperAdmin para tareas de infraestructura global o CRONs.
 * @param tenantId - El tenantId sobre el que operar (por defecto la plataforma maestra).
 */
export function superAdminSystemSession(tenantId: string = SYSTEM_USER_ID): TenantSession {
    const tId = TenantIdSchema.parse(tenantId);

    return {
        user: {
            id: EntityIdSchema.parse(SYSTEM_USER_ID),
            tenantId: tId,
            role: UserRole.SUPER_ADMIN,
            email: 'system@abd.local',
            mfaVerified: true,
            mfaPending: false,
        },
    } as TenantSession;
}

/**
 * 🤖 Genera una sesión de usuario de sistema con un rol específico.
 * @param tenantId - El tenantId sobre el que operar.
 * @param role - El rol a asignar (por defecto SUPER_ADMIN para máxima compatibilidad).
 */
export function getSystemSession(tenantId: string = SYSTEM_USER_ID, role: UserRole = UserRole.SUPER_ADMIN): TenantSession {
    const tId = TenantIdSchema.parse(tenantId);

    return {
        user: {
            id: EntityIdSchema.parse(SYSTEM_USER_ID),
            tenantId: tId,
            role: role,
            email: 'system@abd.local',
            mfaVerified: true,
            mfaPending: false,
        },
    } as TenantSession;
}
