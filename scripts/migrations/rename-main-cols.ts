import path from 'node:path';
import { connectDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function renameMainCollections() {
    try {
        const mainDb = await connectDB();
        const timestamp = '20260309';

        const toMigrated = [
            'translations----',
            'prompts-----',
            'prompt_versions----',
            'document_types------',
            'pricing_plans----',
            'ai_corrections',
            'tenant_configs',
            'workflow_configs',
            'spaces',
            'policies',
            'taxonomies',
            'agent_checkpoints',
            'audit_ingestion'
        ];

        const toUnused = [
            'cases',
            'rag_eval_dataset',
            'rag_feedback',
            'federated_patterns',
            'processed_events',
            'test_isolation',
            'file_blobs',
            'tenants'
        ];

        const existingCollections = (await mainDb.listCollections().toArray()).map(c => c.name);

        for (const colName of toMigrated) {
            if (existingCollections.includes(colName)) {
                const newName = `${colName.replace(/-+$/, '')}_migrated_${timestamp}`;
                console.log(`🏷️  Renaming '${colName}' to '${newName}'...`);
                await mainDb.collection(colName).rename(newName);
            }
        }

        for (const colName of toUnused) {
            if (existingCollections.includes(colName)) {
                const newName = `${colName}_unused_${timestamp}`;
                console.log(`🗑️  Marking '${colName}' as unused: '${newName}'...`);
                await mainDb.collection(colName).rename(newName);
            }
        }

        console.log('\n--- Final MAIN DB Collections ---');
        const finalCols = await mainDb.listCollections().toArray();
        for (const col of finalCols) {
            console.log(`- ${col.name}`);
        }

        await mainDb.client.close();
    } catch (error: any) {
        console.error('Error during renaming:', error.message);
    }
}

renameMainCollections();
