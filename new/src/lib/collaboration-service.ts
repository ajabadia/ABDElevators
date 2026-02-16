import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';

export interface CollaborationSession {
    entityId: string;
    activeUsers: Array<{
        userId: string;
        userName: string;
        lastActive: Date;
        cursorPos?: { x: number; y: number };
    }>;
}

/**
 * CollaborationService: Gestiona la presencia y edición compartida en tiempo real.
 * (Fase Real-time Collaboration)
 */
export class CollaborationService {
    private static sessions = new Map<string, CollaborationSession>();

    /**
     * Registra presencia de un usuario en un recurso.
     */
    public static async trackPresence(entityId: string, user: { id: string, name: string }) {
        let session = this.sessions.get(entityId);

        if (!session) {
            session = { entityId, activeUsers: [] };
            this.sessions.set(entityId, session);
        }

        const existingIdx = session.activeUsers.findIndex(u => u.userId === user.id);
        if (existingIdx >= 0) {
            session.activeUsers[existingIdx].lastActive = new Date();
        } else {
            session.activeUsers.push({
                userId: user.id,
                userName: user.name,
                lastActive: new Date()
            });
        }

        // Limpieza de usuarios inactivos (>30s)
        const now = Date.now();
        session.activeUsers = session.activeUsers.filter(u =>
            now - u.lastActive.getTime() < 30000
        );

        return session;
    }

    /**
     * Obtiene usuarios colaborando actualmente.
     */
    public static getActiveCollaborators(entityId: string) {
        return this.sessions.get(entityId)?.activeUsers || [];
    }
}
