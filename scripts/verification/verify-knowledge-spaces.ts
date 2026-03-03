import { connectDB } from '@/lib/db';
import { getTenantCollection } from '@/lib/db-tenant';
import { SpaceService } from '@/services/tenant/space-service';
import { IngestService } from '@/services/ingest-service';
import { Space } from '@/lib/schemas/spaces';
import { KnowledgeAsset } from '@/lib/schemas/knowledge';
import { TenantService } from '@/services/tenant/tenant-service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    console.log("--- START KNOWLEDGE-SPACES VERIFICATION ---");

    try {
        await connectDB();

        const tenantId = 'tenant_alpha';
        const userA = 'user_001';
        const userB = 'user_002';

        // Ensure tenant exists
        const tenantsCol = await getTenantCollection('tenants', { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });
        await tenantsCol.updateOne(
            { tenantId },
            { $set: { name: 'Alpha Corp', status: 'active', subscription: { planSlug: 'FREE' } } },
            { upsert: true }
        );

        // Cleanup
        const spacesCol = await getTenantCollection<Space>('spaces', { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });
        const assetsCol = await getTenantCollection<KnowledgeAsset>('knowledge_assets', { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });
        await spacesCol.deleteMany({ tenantId });
        await assetsCol.deleteMany({ tenantId });

        const mockAdminSession = { user: { id: 'admin', tenantId: 'platform_master', role: 'SUPER_ADMIN', accessibleSpaces: [] } };

        console.log("[1] Creating Space for User A...");
        const spaceIdA = await SpaceService.createSpace(tenantId, userA, {
            name: "Private Asset Space",
            slug: "private-assets",
            type: "TENANT",
            visibility: "PRIVATE"
        }, { user: { id: userA, tenantId, role: 'ADMIN' } });

        console.log(`OK: Space created: ${spaceIdA}`);

        const sessionA = { user: { id: userA, tenantId, role: 'ADMIN', accessibleSpaces: [spaceIdA.toString()] } };
        const sessionB = { user: { id: userB, tenantId, role: 'USER', accessibleSpaces: [] } };

        console.log("[2] Ingesting Asset into Space A...");
        // Mock a File-like object
        const mockFile = {
            name: "secret_manual.pdf",
            size: 1024,
            arrayBuffer: async () => new ArrayBuffer(1024),
            type: "application/pdf"
        };

        const prep = await IngestService.prepareIngest({
            file: mockFile as any,
            metadata: {
                type: "MANUAL",
                version: "1.0",
                spaceId: spaceIdA.toString()
            },
            tenantId,
            userEmail: "userA@alpha.com",
            session: sessionA
        });

        console.log(`OK: Asset ingested with docId: ${prep.docId}`);

        console.log("[3] Verifying Isolation...");

        const secureColA = await getTenantCollection<KnowledgeAsset>('knowledge_assets', sessionA);
        const secureColB = await getTenantCollection<KnowledgeAsset>('knowledge_assets', sessionB);

        const assetsA = await secureColA.find({});
        const assetsB = await secureColB.find({});

        console.log(`User A sees ${assetsA.length} assets (Expected: 1)`);
        console.log(`User B sees ${assetsB.length} assets (Expected: 0)`);

        if (assetsA.length === 1 && assetsB.length === 0) {
            console.log("--- VERIFICATION SUCCESS ---");
        } else {
            console.error("--- VERIFICATION FAILED: Isolation breach or asset not found ---");
            process.exit(1);
        }

    } catch (error) {
        console.error("--- VERIFICATION ERROR ---", error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

test();
