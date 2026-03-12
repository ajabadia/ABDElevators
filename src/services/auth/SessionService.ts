import { ObjectId } from "mongodb";
import { EntityIdSchema, TenantIdSchema } from "@/lib/schemas/common";
import { getTenantCollection } from "@/lib/db-tenant";
import { type TenantId, type EntityId } from "@/lib/schemas/common";
import { UserSession } from "@/lib/schemas/auth";

/**
 * Servicio para la gestión de sesiones activas (Fase 11)
 * Almacenado en ABDElevators-Auth (Clúster separado)
 */
export class SessionService {
    /**
     * Registra una nueva sesión tras un login exitoso.
     */
    static async createSession(payload: {
        userId: string;
        email: string;
        tenantId: string;
        ip: string;
        userAgent: string;
    }): Promise<string> {
        // Local validation
        const userId = EntityIdSchema.parse(payload.userId);
        const tenantId = TenantIdSchema.parse(payload.tenantId);

        // System session for Auth cluster access
        const systemSession = { user: { id: userId, tenantId, role: 'USER' } }; // Use user context
        const sessions = await getTenantCollection<UserSession>('sessions', systemSession as any, 'AUTH');

        const deviceInfo = this.parseUserAgent(payload.userAgent);

        const newSession: UserSession = {
            userId,
            email: payload.email,
            tenantId,
            ip: payload.ip,
            userAgent: payload.userAgent,
            device: deviceInfo,
            isCurrent: false,
            lastActive: new Date(),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        };

        try {
            const result = await sessions.insertOne(newSession as any);
            return result.insertedId.toString();
        } catch (error: unknown) {
            throw error;
        }
    }

    /**
     * Verifica si una sesión sigue siendo válida.
     */
    static async validateSession(sessionId: string, tenantId: string): Promise<boolean> {
        try {
            const systemSession = { user: { id: '000000000000000000000000' as EntityId, tenantId: tenantId as TenantId, role: 'USER' } };
            const sessions = await getTenantCollection<UserSession>('sessions', systemSession as any, 'AUTH');
            
            const session = await sessions.findOne({
                _id: new ObjectId(sessionId) as any,
                expiresAt: { $gt: new Date() }
            } as any);

            if (session) {
                // Actualizar lastActive de forma asíncrona
                sessions.updateOne(
                    { _id: new ObjectId(sessionId) as any },
                    { $set: { lastActive: new Date() } }
                ).catch(() => {});
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Obtiene todas las sesiones activas de un usuario.
     */
    static async getUserSessions(userId: string, tenantId: string): Promise<UserSession[]> {
        const systemSession = { user: { id: userId, tenantId: tenantId as TenantId, role: 'USER' } };
        const sessions = await getTenantCollection<UserSession>('sessions', systemSession as any, 'AUTH');
        
        const results = await sessions.find({
            userId: userId as any,
            expiresAt: { $gt: new Date() }
        } as any, {
            sort: { lastActive: -1 } as any
        });

        return results as unknown as UserSession[];
    }

    /**
     * Revoca una sesión específica.
     */
    static async revokeSession(sessionId: string, userId: string, tenantId: string): Promise<boolean> {
        const systemSession = { user: { id: userId, tenantId: tenantId as TenantId, role: 'USER' } };
        const sessions = await getTenantCollection<UserSession>('sessions', systemSession as any, 'AUTH');
        
        const result = await sessions.deleteOne({
            _id: new ObjectId(sessionId) as any,
            userId: userId as any
        } as any);
        return result.deletedCount > 0;
    }

    /**
     * Revoca TODAS las sesiones de un usuario (útil ante cambio de pass o sospecha).
     */
    static async revokeAllUserSessions(userId: string, tenantId: string, exceptSessionId?: string): Promise<void> {
        const systemSession = { user: { id: userId, tenantId: tenantId as TenantId, role: 'USER' } };
        const sessions = await getTenantCollection<UserSession>('sessions', systemSession as any, 'AUTH');
        
        const query: Record<string, unknown> = { userId };
        if (exceptSessionId) {
            query._id = { $ne: new ObjectId(exceptSessionId) };
        }
        await sessions.deleteMany(query as any);
    }

    /**
     * Helper manual para parsear UserAgent sin dependencias externas
     */
    private static parseUserAgent(ua: string): { browser?: string, os?: string, type: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN' } {
        const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
        const isTablet = /iPad|Tablet/i.test(ua);

        let os = 'Unknown';
        if (/Windows/i.test(ua)) os = 'Windows';
        else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
        else if (/Linux/i.test(ua)) os = 'Linux';

        let browser = 'Unknown';
        if (/Chrome/i.test(ua)) browser = 'Chrome';
        else if (/Safari/i.test(ua)) browser = 'Safari';
        else if (/Firefox/i.test(ua)) browser = 'Firefox';
        else if (/Edge/i.test(ua)) browser = 'Edge';
        else if (/MSIE|Trident/i.test(ua)) browser = 'Internet Explorer';

        return {
            os,
            browser,
            type: isTablet ? 'TABLET' : isMobile ? 'MOBILE' : 'DESKTOP'
        };
    }
}
