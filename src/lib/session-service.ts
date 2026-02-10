import { connectAuthDB } from "./db";
import { UserSession, UserSessionSchema } from "./schemas";
import { ObjectId } from "mongodb";

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
        console.log(`🤝 [SESSION_SERVICE] Creating session for ${payload.email}...`);
        const db = await connectAuthDB();
        const sessions = db.collection('sessions');

        const deviceInfo = this.parseUserAgent(payload.userAgent);

        const newSession: UserSession = {
            userId: payload.userId,
            email: payload.email,
            tenantId: payload.tenantId,
            ip: payload.ip,
            userAgent: payload.userAgent,
            device: deviceInfo,
            isCurrent: false,
            lastActive: new Date(),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        };

        try {
            console.log(`🧪 [SESSION_SERVICE] Validating UserSessionSchema for ${payload.email}...`);
            const validated = UserSessionSchema.parse(newSession);
            console.log(`✅ [SESSION_SERVICE] Validation SUCCESS for ${payload.email}`);

            const result = await sessions.insertOne(validated);
            console.log(`🤝 [SESSION_SERVICE] Inserted session ID: ${result.insertedId}`);
            return result.insertedId.toString();
        } catch (error: any) {
            console.error(`💥 [SESSION_SERVICE] Validation or Insertion FAILED:`, error.message);
            if (error.name === 'ZodError') {
                console.error(`🔍 [SESSION_SERVICE] ZodError details:`, JSON.stringify(error.errors, null, 2));
            }
            throw error;
        }
    }

    /**
     * Verifica si una sesión sigue siendo válida.
     */
    static async validateSession(sessionId: string): Promise<boolean> {
        try {
            const db = await connectAuthDB();
            const session = await db.collection('sessions').findOne({
                _id: new ObjectId(sessionId),
                expiresAt: { $gt: new Date() }
            });

            if (session) {
                // Actualizar lastActive de forma asíncrona (no bloqueante)
                db.collection('sessions').updateOne(
                    { _id: new ObjectId(sessionId) },
                    { $set: { lastActive: new Date() } }
                ).catch(console.error);
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
    static async getUserSessions(userId: string): Promise<UserSession[]> {
        const db = await connectAuthDB();
        const results = await db.collection('sessions')
            .find({
                userId,
                expiresAt: { $gt: new Date() }
            })
            .sort({ lastActive: -1 })
            .toArray();

        return results as any;
    }

    /**
     * Revoca una sesión específica.
     */
    static async revokeSession(sessionId: string, userId: string): Promise<boolean> {
        const db = await connectAuthDB();
        const result = await db.collection('sessions').deleteOne({
            _id: new ObjectId(sessionId),
            userId
        });
        return result.deletedCount > 0;
    }

    /**
     * Revoca TODAS las sesiones de un usuario (útil ante cambio de pass o sospecha).
     */
    static async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
        const db = await connectAuthDB();
        const query: any = { userId };
        if (exceptSessionId) {
            query._id = { $ne: new ObjectId(exceptSessionId) };
        }
        await db.collection('sessions').deleteMany(query);
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
