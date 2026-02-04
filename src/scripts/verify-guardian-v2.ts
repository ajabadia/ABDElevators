import { GuardianEngine } from '../core/guardian/GuardianEngine';
import { User, PermissionPolicy, PermissionGroup } from '../lib/schemas';
import { UserRole } from '../types/roles';
import { ObjectId } from 'mongodb';
import { connectAuthDB } from '../lib/db';
import { getTenantCollection } from '../lib/db-tenant';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * Script de verificación para Guardian V2
 */
async function verifyGuardianV2() {
    console.log('🛡️  Starting Guardian V2 Logic Verification...');

    const tenantId = 'test_guardian_v2';
    const mockSession = { user: { tenantId, role: UserRole.TECHNICAL } };

    const db = await connectAuthDB();
    const policiesColl = await getTenantCollection('policies', mockSession);
    const groupsColl = await getTenantCollection('permission_groups', mockSession);
    const usersColl = db.collection('users');

    try {
        // 1. Cleanup
        await policiesColl.deleteMany({ tenantId });
        await groupsColl.deleteMany({ tenantId });
        await usersColl.deleteMany({ email: 'carlos_verify@test.com' });

        // 2. Create Policies
        const policyRead = {
            tenantId,
            name: 'Allow Read All',
            effect: 'ALLOW' as const,
            resources: ['*'],
            actions: ['read'],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const p1 = await policiesColl.insertOne(policyRead);

        const policyDenyDelete = {
            tenantId,
            name: 'Deny Global Delete',
            effect: 'DENY' as const,
            resources: ['*'],
            actions: ['delete'],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const p2 = await policiesColl.insertOne(policyDenyDelete);

        // 3. Create Group
        const groupAdmin = {
            tenantId,
            name: 'Verified Admin',
            slug: 'verified-admin',
            policies: [p1.insertedId.toString()],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const g1 = await groupsColl.insertOne(groupAdmin);

        // 4. Create User Carlos
        // Carlos belongs to Admin group (ALLOW read)
        // BUT Carlos has an override: Deny Global Delete
        const userCarlos: Partial<User> = {
            email: 'carlos_verify@test.com',
            firstName: 'Carlos',
            lastName: 'Verify',
            role: UserRole.TECHNICAL,
            tenantId,
            permissionGroups: [g1.insertedId.toString()],
            permissionOverrides: [p2.insertedId.toString()],
            isActive: true,
            password: 'hashed_dummy',
            industry: 'ELEVATORS',
            activeModules: ['TECHNICAL']
        };
        await usersColl.insertOne(userCarlos);

        const engine = GuardianEngine.getInstance();

        console.log('\n--- Evaluating Permissions for Carlos ---');

        // Test 1: Should ALLOW read (inherited from group)
        const res1 = await engine.evaluate(userCarlos as User, 'workflow:123', 'read');
        console.log(`[READ workflow:123] Expected: ALLOW, Actual: ${res1.allowed ? 'ALLOW' : 'DENY'} (${res1.reason})`);

        // Test 2: Should DENY delete (direct override)
        const res2 = await engine.evaluate(userCarlos as User, 'workflow:123', 'delete');
        console.log(`[DELETE workflow:123] Expected: DENY, Actual: ${res2.allowed ? 'ALLOW' : 'DENY'} (${res2.reason})`);

        // Test 3: Should DENY write (implicit deny)
        const res3 = await engine.evaluate(userCarlos as User, 'workflow:123', 'write');
        console.log(`[WRITE workflow:123] Expected: DENY (Implicit), Actual: ${res3.allowed ? 'ALLOW' : 'DENY'} (${res3.reason})`);

        console.log('\n✅ Verification completed successfully.');

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        // We'll keep the data for a moment if the user wants to see it in Compass, 
        // but normally we'd clean up.
        process.exit(0);
    }
}

verifyGuardianV2();
