import { enforcePermission } from '@/lib/guardian-guard';
import { AppError } from '@/lib/errors';
import { GuardianEngine } from '@/core/guardian/GuardianEngine';
import { logEvento } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
    auth: jest.fn()
}));

jest.mock('@/core/guardian/GuardianEngine', () => ({
    GuardianEngine: {
        getInstance: jest.fn().mockReturnValue({
            evaluate: jest.fn()
        })
    }
}));

jest.mock('@/lib/logger', () => ({
    logEvento: jest.fn().mockResolvedValue(undefined)
}));

describe('🛡️ enforcePermission', () => {
    const { auth } = require('@/lib/auth');
    const engine = GuardianEngine.getInstance();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw UNAUTHORIZED if no session', async () => {
        (auth as jest.Mock).mockResolvedValue(null);

        await expect(enforcePermission('DOCS', 'READ'))
            .rejects.toThrow(AppError);

        try {
            await enforcePermission('DOCS', 'READ');
        } catch (e: any) {
            expect(e.code).toBe('UNAUTHORIZED');
            expect(e.status).toBe(401);
        }
    });

    it('should throw FORBIDDEN if permission denied', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { email: 'test@user.com', id: 'user-123' }
        });

        (engine.evaluate as jest.Mock).mockResolvedValue({
            allowed: false,
            reason: 'Insufficient level'
        });

        await expect(enforcePermission('ADMIN', 'WRITE'))
            .rejects.toThrow(AppError);

        expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
            level: 'WARN',
            action: 'PERMISSION_DENIED'
        }));
    });

    it('should return session if permission granted', async () => {
        const session = {
            user: { email: 'admin@user.com', id: 'admin-123' }
        };
        (auth as jest.Mock).mockResolvedValue(session);

        (engine.evaluate as jest.Mock).mockResolvedValue({
            allowed: true
        });

        const result = await enforcePermission('DASHBOARD', 'VIEW');

        expect(result).toEqual(session);
        expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
            level: 'DEBUG',
            action: 'PERMISSION_GRANTED'
        }));
    });
});
