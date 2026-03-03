import { connectDB } from '@/lib/db';
import { getTenantCollection } from '@/lib/db-tenant';
import { SpaceService } from '@/services/space-service';
import { Space } from '@/lib/schemas/spaces';
import { KnowledgeAsset } from '@/lib/schemas/knowledge';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (process.env.NODE_ENV === 'production') {
    console.error('❌ Este script NO debe ejecutarse en producción. Abortando.');
    process.exit(1);
}

async function migrate() {
    console.log("--- START ASSET MIGRATION TO SPACES ---");

    try {
        await connectDB();

        // 1. Get all tenants from AUTH DB
        const tenantsCol = await getTenantCollection('tenants', { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });
        const tenants = await tenantsCol.find({ status: 'active' });

        console.log(`Found ${tenants.length} active tenants.`);

        for (const tenant of tenants) {
            const tenantId = tenant.tenantId;
            console.log(`\nProcessing Tenant: ${tenantId}...`);

            // 2. Ensure a "General" space exists
            const spacesCol = await getTenantCollection<Space>('spaces', { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });
            let defaultSpace = await spacesCol.findOne({ tenantId, isDefault: true });

            if (!defaultSpace) {
                console.log(`[${tenantId}] Creating Default 'General' Space...`);
                const spaceId = await SpaceService.createSpace(tenantId, 'SYSTEM_MIGRATION', {
                    name: "General",
                    slug: "general",
                    type: "TENANT",
                    visibility: "INTERNAL",
                    config: {
                        isDefault: true,
                        allowQuickQA: true
                    }
                }, { user: { id: 'system', tenantId: 'platform_master', role: 'SUPER_ADMIN' } });

                defaultSpace = await spacesCol.findOne({ _id: spaceId });
            }

            if (!defaultSpace) {
                console.error(`[${tenantId}] FAILED to create/find default space.`);
                continue;
            }

            console.log(`[${tenantId}] Default Space: ${defaultSpace._id}`);

            // 3. Update all assets for this tenant that lack a spaceId
            const assetsCol = await getTenantCollection<KnowledgeAsset>('knowledge_assets', { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });
            const result = await assetsCol.updateMany(
                { tenantId, spaceId: { $exists: false } },
                { $set: { spaceId: defaultSpace._id.toString(), updatedAt: new Date() } }
            );

            console.log(`[${tenantId}] Updated ${result.modifiedCount} legacy assets.`);
        }

        console.log("\n--- MIGRATION COMPLETED SUCCESSFULLY ---");

    } catch (error) {
        console.error("--- MIGRATION ERROR ---", error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

migrate();
