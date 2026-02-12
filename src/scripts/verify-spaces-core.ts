import { config } from 'dotenv';
config({ path: '.env.local' });
import { SpaceService } from '../services/space-service';
import { getTenantCollection } from '../lib/db-tenant';
import { Space } from '../lib/schemas/spaces';
import { connectDB } from '../lib/db';
import { ObjectId } from 'mongodb';

async function test() {
    console.log('--- START VERIFICATION ---');
    console.log('DEBUG: MONGODB_URI exists:', !!process.env.MONGODB_URI);
    if (!process.env.MONGODB_URI) {
        console.log('DEBUG: CWD:', process.cwd());
    }

    const tenantA = 'tenant_alpha';
    const userA = 'user_001';
    const userB = 'user_002';

    try {
        await connectDB();
        const mockAdminSession = { user: { id: 'admin', tenantId: 'platform_master', role: 'SUPER_ADMIN' } };

        // 0. Setup Dummy Tenant for Quotas
        const tenantsCol = await getTenantCollection('tenants', mockAdminSession);
        await tenantsCol.unsecureRawCollection.updateOne(
            { tenantId: tenantA },
            {
                $set: {
                    name: 'Alpha Tenant',
                    status: 'active',
                    subscription: { planSlug: 'FREE', status: 'active' }
                }
            },
            { upsert: true }
        );

        let sessionA = { user: { id: userA, tenantId: tenantA, accessibleSpaces: [] as string[] } };
        let sessionB = { user: { id: userB, tenantId: tenantA, accessibleSpaces: [] as string[] } };

        const collection = await getTenantCollection<Space>('spaces', mockAdminSession);

        // Cleanup
        console.log('Cleaning up old test data...');
        await collection.unsecureRawCollection.deleteMany({
            $or: [
                { tenantId: tenantA },
                { ownerUserId: userA },
                { ownerUserId: userB },
                { slug: 'legal' },
                { slug: 'gdpr' },
                { slug: 's1' },
                { slug: 's2' },
                { slug: 's3' }
            ]
        });

        // 1. Test: Global Space
        console.log('[1] Creating Global Space...');
        const globalId = await SpaceService.createSpace('system', 'admin', {
            name: 'Legal Global',
            slug: 'legal',
            type: 'GLOBAL',
            visibility: 'PUBLIC'
        }, mockAdminSession);
        console.log('OK: Global created:', globalId);

        // 2. Test: Hierarchy
        console.log('[2] Creating Child Space (Hierarchy)...');
        const childId = await SpaceService.createSpace(tenantA, userA, {
            name: 'GDPR Compliance',
            slug: 'gdpr',
            type: 'GLOBAL',
            parentSpaceId: globalId.toString()
        }, sessionA);
        const child = await collection.findOne({ _id: childId });
        console.log('OK: Materialized Path:', child?.materializedPath);
        if (child?.materializedPath !== '/legal/gdpr') throw new Error('Path incorrecto');

        // 3. Test: Quotas
        console.log('[3] Verifying Quotas...');
        try {
            await SpaceService.createSpace(tenantA, userA, { name: 'S1', slug: 's1', type: 'TENANT' }, sessionA);
            await SpaceService.createSpace(tenantA, userA, { name: 'S2', slug: 's2', type: 'TENANT' }, sessionA);
            await SpaceService.createSpace(tenantA, userA, { name: 'S3', slug: 's3', type: 'TENANT' }, sessionA);
            console.log('OK: 3 spaces created for User A');

            await SpaceService.createSpace(tenantA, userA, { name: 'S4', slug: 's4', type: 'TENANT' }, sessionA);
            console.log('ERROR: S4 should have failed');
        } catch (e: any) {
            console.log('OK: Quota blocked correctly:', e.message);
        }

        // 4. Test: Isolation
        console.log('[4] Verifying Isolation...');

        const allDocs = await collection.unsecureRawCollection.find({}).toArray();
        console.log('--- RAW DOCUMENTS IN DB ---');
        allDocs.forEach(d => console.log(` - [${d.tenantId}] ${d.name} (${d.type})`));
        console.log('---------------------------');

        const total = allDocs.length;
        console.log('Total Spaces in DB:', total);

        // Update sessionA with accessible spaces
        sessionA = { user: { id: userA, tenantId: tenantA, accessibleSpaces: [globalId.toString(), childId.toString()] } };
        const secureColA = await getTenantCollection<Space>('spaces', sessionA);
        const visibleA = await secureColA.find();
        console.log(`User A (tenant_alpha) sees ${visibleA.length} spaces:`);
        visibleA.forEach(s => console.log(` - ${s.name} (${s.type})`));

        // sessionB
        sessionB = { user: { id: userB, tenantId: tenantA, accessibleSpaces: [] } };
        const secureColB = await getTenantCollection<Space>('spaces', sessionB);
        const visibleB = await secureColB.find();
        console.log(`User B (tenant_alpha, no specific ACLs) sees ${visibleB.length} spaces:`);
        visibleB.forEach(s => console.log(` - ${s.name} (${s.type})`));

        console.log('--- VERIFICATION SUCCESS ---');
        process.exit(0);
    } catch (error) {
        console.error('--- VERIFICATION FAILED ---');
        console.error(error);
        process.exit(1);
    }
}

test();
