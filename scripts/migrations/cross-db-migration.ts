import path from 'node:path';
import { connectDB, connectConfigDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateCollection(collectionName: string) {
    try {
        console.log(`🚀 Migrating collection '${collectionName}' from MAIN to CONFIG...`);

        const mainDb = await connectDB();
        const configDb = await connectConfigDB();

        const sourceCollection = mainDb.collection(collectionName);
        const targetCollection = configDb.collection(collectionName);

        const data = await sourceCollection.find({}).toArray();
        console.log(`📦 Found ${data.length} documents in ${collectionName}.`);

        if (data.length > 0) {
            // Optional: Clean target collection first (controlled by flag or logic)
            await targetCollection.deleteMany({});
            console.log(`🧹 Target collection '${collectionName}' cleaned.`);

            await targetCollection.insertMany(data);
            console.log(`✅ ${data.length} documents migrated to CONFIG DB.`);
        } else {
            console.log(`⚠️  No data found in source collection '${collectionName}'.`);
        }

    } catch (error: any) {
        console.error(`❌ Error migrating '${collectionName}':`, error.message);
    }
}

async function runMigrations() {
    const collectionsToMigrate = ['translations', 'prompts'];
    for (const col of collectionsToMigrate) {
        await migrateCollection(col);
    }
    process.exit(0);
}

runMigrations();
