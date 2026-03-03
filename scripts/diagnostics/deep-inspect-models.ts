
import { getTenantCollection, TenantSession } from '../src/lib/db-tenant';
import { AI_MODEL_IDS } from '../packages/platform-core/src/constants/ai-models';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function deepInspect() {
    console.log('🔍 Deep Inspecting Models across clusters...');

    const session: any = { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } };
    const clusters: any[] = ['MAIN', 'AUTH', 'LOGS'];
    const collections = ['prompts', 'ai_configs'];

    for (const cluster of clusters) {
        console.log(`\n--- Cluster: ${cluster} ---`);
        for (const colName of collections) {
            try {
                const collection = await getTenantCollection(colName, session, cluster);

                // Find any reference to gemini-1.5
                const legacyItems = await collection.find({
                    $or: [
                        { model: { $regex: /gemini-1\.5/i } },
                        { defaultModel: { $regex: /gemini-1\.5/i } },
                        { fallbackModel: { $regex: /gemini-1\.5/i } },
                        { ragGeneratorModel: { $regex: /gemini-1\.5/i } },
                        { ragQueryRewriterModel: { $regex: /gemini-1\.5/i } }
                    ]
                }).toArray();

                if (legacyItems.length > 0) {
                    console.log(`⚠️ Found ${legacyItems.length} legacy items in ${colName} [${cluster}]:`);
                    legacyItems.forEach(item => {
                        console.log(`  - ID: ${item._id}, Key/Tenant: ${item.key || item.tenantId}, Model: ${item.model || item.defaultModel}`);
                    });
                } else {
                    console.log(`✅ No legacy items in ${colName} [${cluster}]`);
                }
            } catch (err: any) {
                console.log(`❌ Error accessing ${colName} in ${cluster}:`, err.message);
            }
        }
    }

    process.exit(0);
}

deepInspect();
