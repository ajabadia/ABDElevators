
import { getTenantCollection } from '../src/lib/db-tenant';
import { AI_MODEL_IDS } from '../packages/platform-core/src/constants/ai-models';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function exhaustiveMigration() {
    console.log('🚀 Starting EXHAUSTIVE multi-cluster migration...');

    const session: any = { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } };
    const clusters: any[] = ['MAIN', 'AUTH', 'LOGS'];
    const collections = ['prompts', 'ai_configs'];

    for (const cluster of clusters) {
        console.log(`\n📦 Cluster: ${cluster}`);
        for (const colName of collections) {
            try {
                const collection = await getTenantCollection(colName, session, cluster);

                // 1. Migrate 'model' field (for prompts)
                const res1 = await (collection as any).updateMany(
                    { model: { $regex: /gemini-1\.5-flash/i } },
                    { $set: { model: AI_MODEL_IDS.GEMINI_2_5_FLASH, updatedAt: new Date() } }
                );

                const res2 = await (collection as any).updateMany(
                    { model: { $regex: /gemini-1\.5-pro/i } },
                    { $set: { model: AI_MODEL_IDS.GEMINI_2_5_PRO, updatedAt: new Date() } }
                );

                // 2. Migrate 'defaultModel' and others (for ai_configs)
                const res3 = await (collection as any).updateMany(
                    { defaultModel: { $regex: /gemini-1\.5-flash/i } },
                    { $set: { defaultModel: AI_MODEL_IDS.GEMINI_2_5_FLASH, updatedAt: new Date() } }
                );

                const res4 = await (collection as any).updateMany(
                    { ragQueryRewriterModel: { $regex: /gemini-1\.5-flash/i } },
                    { $set: { ragQueryRewriterModel: AI_MODEL_IDS.GEMINI_2_5_FLASH, updatedAt: new Date() } }
                );

                const total = (res1.modifiedCount || 0) + (res2.modifiedCount || 0) + (res3.modifiedCount || 0) + (res4.modifiedCount || 0);
                if (total > 0) {
                    console.log(`✅ Updated ${total} documents in ${colName}`);
                } else {
                    console.log(`ℹ️ No legacy items found in ${colName}`);
                }

            } catch (err: any) {
                console.log(`❌ Error in ${colName} [${cluster}]:`, err.message);
            }
        }
    }

    console.log('\n✨ Exhaustive migration finished.');
    process.exit(0);
}

exhaustiveMigration();
