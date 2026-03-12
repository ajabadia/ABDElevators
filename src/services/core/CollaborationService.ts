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
 * CollaborationService: Manages real-time presence and shared editing.
 * (Real-time Collaboration Phase)
 */
export class CollaborationService {
    private static sessions = new Map<string, CollaborationSession>();

    /**
     * Registers user presence on a resource.
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

        // Cleanup inactive users (>30s)
        const now = Date.now();
        session.activeUsers = session.activeUsers.filter(u =>
            now - u.lastActive.getTime() < 30000
        );

        return session;
    }

    /**
     * Retrieves currently collaborating users.
     */
    public static getActiveCollaborators(entityId: string) {
        return this.sessions.get(entityId)?.activeUsers || [];
    }
}
