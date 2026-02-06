import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    const correlationId = 'SYNC_DB_I18N_' + Date.now();
    console.log(`🚀 Starting terminology sync to DB (Correlation: ${correlationId})`);

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in .env.local');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db('ABDElevators');
        const collection = db.collection('translations');

        const locales = ['es', 'en'];

        for (const locale of locales) {
            console.log(`\n📦 Syncing [${locale}]...`);

            // Load JSON file
            const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ File not found: ${filePath}`);
                continue;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const messages = JSON.parse(content);

            // Flatten nested object
            const flat = nestToFlat(messages);
            console.log(`📋 Found ${Object.keys(flat).length} translation keys`);

            // Prepare bulk operations
            const operations = Object.entries(flat).map(([key, value]) => ({
                updateOne: {
                    filter: { key, locale },
                    update: {
                        $set: {
                            value,
                            locale,
                            namespace: key.split('.')[0] || 'common',
                            isObsolete: false,
                            lastUpdated: new Date(),
                            tenantId: 'platform_master'
                        }
                    },
                    upsert: true
                }
            }));

            // Execute in batches of 500
            let successCount = 0;
            for (let i = 0; i < operations.length; i += 500) {
                const batch = operations.slice(i, i + 500);
                try {
                    const result = await collection.bulkWrite(batch, { ordered: false });
                    successCount += (result.upsertedCount + result.modifiedCount);
                    console.log(`  ✓ Synced batch ${Math.floor(i / 500) + 1}/${Math.ceil(operations.length / 500)}`);
                } catch (error: any) {
                    // Continue even if some operations fail (e.g., duplicate keys)
                    console.warn(`  ⚠️ Batch ${Math.floor(i / 500) + 1} had some errors, continuing...`);
                }
            }

            console.log(`✅ [${locale}] synced successfully`);
        }

        console.log('\n🎉 Terminology sync completed for all locales');
        process.exit(0);
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

function nestToFlat(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, nestToFlat(value, newKey));
        } else {
            result[newKey] = String(value);
        }
    }
    return result;
}

main();
