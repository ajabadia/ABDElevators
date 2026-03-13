import { GuardianEngine, type EvaluationUser } from '@/core/guardian/GuardianEngine';
import { UserRole } from '@/types/roles';
import { Redis } from '@upstash/redis';

// Mock Redis
jest.mock('@upstash/redis', () => {
    return {
        Redis: jest.fn().mockImplementation(() => {
            return {
                get: jest.fn().mockResolvedValue(null),
                set: jest.fn().mockResolvedValue('OK'),
            };
        }),
    };
});

// Mock getTenantCollection
jest.mock('@/lib/db-tenant', () => ({
    getTenantCollection: jest.fn().mockResolvedValue({
        findOne: jest.fn(),
        find: jest.fn().mockReturnValue({
            forEach: jest.fn(),
            toArray: jest.fn().mockResolvedValue([]),
        }),
        insertOne: jest.fn(),
    }),
}));

describe('GuardianEngine (Phase 345)', () => {
    let engine: GuardianEngine;

    beforeEach(() => {
        jest.clearAllMocks();
        engine = GuardianEngine.getInstance();
    });

    it('should allow SUPER_ADMIN bypass', async () => {
        const user: EvaluationUser = {
            id: 'user-1' as any,
            role: UserRole.SUPER_ADMIN,
            tenantId: 'tenant-1' as any,
        };
        const result = await engine.evaluate(user, 'any', 'read');
        expect(result.allowed).toBe(true);
        expect(result.reason).toContain('SUPER_ADMIN');
    });

    it('should audit decisions in the database', async () => {
        const user: EvaluationUser = {
            id: 'user-2' as any,
            role: UserRole.TECHNICAL,
            tenantId: 'tenant-1' as any,
            permissionGroups: [],
        };

        // This will result in an implicit deny
        await engine.evaluate(user, 'res:1', 'read');

        // Wait for next tick since auditDecision is now non-blocking (setTimeout 0)
        await new Promise(resolve => setTimeout(resolve, 0));

        const { getTenantCollection } = require('@/lib/db-tenant');
        const collection = await getTenantCollection('access_logs');
        expect(collection.insertOne).toHaveBeenCalled();
    });
});
