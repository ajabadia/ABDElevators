import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { connectDB } from '../src/lib/db';
import { SecureCollection } from '../src/lib/db-tenant';
import { UserRole } from '../src/types/roles';

async function verifyIsolation() {
    console.log('🧪 [TEST] Starting Tenant Isolation Verification...');

    const db = await connectDB();
    const testCollection = db.collection('test_isolation');

    // Clean up
    await testCollection.deleteMany({});

    // 1. Setup Tenant A
    const sessionA = {
        user: {
            id: 'user-a',
            email: 'admin@tenant-a.com',
            tenantId: 'tenant-a',
            role: UserRole.ADMIN
        }
    };
    const secureA = new SecureCollection(testCollection, sessionA);

    // 2. Setup Tenant B
    const sessionB = {
        user: {
            id: 'user-b',
            email: 'admin@tenant-b.com',
            tenantId: 'tenant-b',
            role: UserRole.ADMIN
        }
    };
    const secureB = new SecureCollection(testCollection, sessionB);

    try {
        // Test 1: Insert data as Tenant A
        console.log('📝 Inserting data as Tenant A...');
        await secureA.insertOne({ name: 'Secret A', data: 'Confidential A' } as any);

        // Test 2: Insert data as Tenant B
        console.log('📝 Inserting data as Tenant B...');
        await secureB.insertOne({ name: 'Secret B', data: 'Confidential B' } as any);

        // Test 3: Tenant A should ONLY see its own data
        console.log('🔍 Checking visibility for Tenant A...');
        const docsA = await secureA.find({});
        console.log(`   Found ${docsA.length} documents for Tenant A`);
        if (docsA.length !== 1 || docsA[0].name !== 'Secret A') {
            throw new Error('❌ FAILURE: Tenant A saw more than its own data or wrong data');
        }

        // Test 4: Tenant B should ONLY see its own data
        console.log('🔍 Checking visibility for Tenant B...');
        const docsB = await secureB.find({});
        console.log(`   Found ${docsB.length} documents for Tenant B`);
        if (docsB.length !== 1 || docsB[0].name !== 'Secret B') {
            throw new Error('❌ FAILURE: Tenant B saw more than its own data or wrong data');
        }

        // Test 5: Update isolation
        console.log('🔄 Checking update isolation...');
        await secureA.updateOne({ name: 'Secret B' } as any, { $set: { data: 'HACKED' } } as any);
        const docB_after = await secureB.findOne({ name: 'Secret B' } as any);
        if (docB_after?.data === 'HACKED') {
            throw new Error('❌ FAILURE: Tenant A was able to update Tenant B data');
        }
        console.log('   ✅ Update isolation verified');

        // Test 6: Super Admin Bypass
        console.log('👑 Checking Super Admin global visibility...');
        const sessionSA = {
            user: {
                id: 'super-admin',
                email: 'sa@abd.com',
                tenantId: 'platform_master',
                role: UserRole.SUPER_ADMIN
            }
        };
        const secureSA = new SecureCollection(testCollection, sessionSA);
        const docsSA = await secureSA.find({});
        console.log(`   Found ${docsSA.length} documents for Super Admin`);
        if (docsSA.length !== 2) {
            throw new Error('❌ FAILURE: Super Admin should see all data');
        }

        console.log('\n✨ [SUCCESS] All Tenant Isolation tests PASSED!');

    } catch (error: any) {
        console.error('\n💥 [TEST FAILED]', error.message);
        process.exit(1);
    } finally {
        await testCollection.deleteMany({});
        process.exit(0);
    }
}

verifyIsolation();
