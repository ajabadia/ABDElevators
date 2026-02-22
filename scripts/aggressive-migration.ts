
import { getTenantCollection } from '../src/lib/db-tenant';
import { AI_MODEL_IDS } from '../packages/platform-core/src/constants/ai-models';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function aggressiveMigration() {
    console.log('🚀 Starting AGGRESSIVE multi-cluster migration...');

    const session: any = { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } };
    const clusters: any[] = ['MAIN', 'AUTH', 'LOGS'];
    const collections = ['prompts', 'ai_configs'];
    const fieldsToFix = ['model', 'defaultModel', 'fallbackModel', 'ragGeneratorModel', 'ragQueryRewriterModel', 'reportGeneratorModel', 'workflowRouterModel', 'workflowNodeAnalyzerModel', 'ontologyRefinerModel', 'queryEntityExtractorModel'];

    for (const cluster of clusters) {
        console.log(`\n📦 Cluster: ${cluster}`);
        for (const colName of collections) {
            try {
                const collection = await getTenantCollection(colName, session, cluster);

                // Find ALL documents in this collection
                const docs = await (collection as any).find({}).toArray();
                console.log(`  - Checking ${docs.length} documents in ${colName}...`);

                let updatedInCol = 0;
                for (const doc of docs) {
                    let needsUpdate = false;
                    const updates: any = {};

                    for (const field of fieldsToFix) {
                        const val = doc[field];
                        if (typeof val === 'string' && val.toLowerCase().includes('gemini-1.5')) {
                            const newVal = val.toLowerCase().includes('pro')
                                ? AI_MODEL_IDS.GEMINI_2_5_PRO
                                : AI_MODEL_IDS.GEMINI_2_5_FLASH;

                            console.log(`    ⚠️  Fixing ${field} in ${doc.key || doc.tenantId || doc._id}: ${val} -> ${newVal}`);
                            updates[field] = newVal;
                            needsUpdate = true;
                        }
                    }

                    if (needsUpdate) {
                        await (collection as any).updateOne(
                            { _id: doc._id },
                            { $set: { ...updates, updatedAt: new Date() } }
                        );
                        updatedInCol++;
                    }
                }

                if (updatedInCol > 0) {
                    console.log(`  ✅ Successfully updated ${updatedInCol} documents in ${colName}`);
                }
            } catch (err: any) {
                console.log(`  ❌ Error in ${colName} [${cluster}]:`, err.message);
            }
        }
    }

    console.log('\n✨ Aggressive migration finished.');
    process.exit(0);
}

aggressiveMigration();
