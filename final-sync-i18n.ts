
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const uri = 'mongodb+srv://abadia3d_db_user:Ajabafan1974@pruebas.nwakk9f.mongodb.net/?appName=pruebas';
const client = new MongoClient(uri);

function getFlattened(obj: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in obj) {
        const val = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            Object.assign(result, getFlattened(val, newKey));
        } else {
            result[newKey] = val;
        }
    }
    return result;
}

async function sync() {
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const collection = db.collection('translations');

        const locales = ['es', 'en'];
        const messagesDir = path.resolve(process.cwd(), 'messages');

        for (const locale of locales) {
            console.log(`\n--- Syncing Locale: ${locale} ---`);
            const files = fs.readdirSync(path.join(messagesDir, locale)).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const namespace = file.replace('.json', '');
                const content = JSON.parse(fs.readFileSync(path.join(messagesDir, locale, file), 'utf8'));
                const flat = getFlattened(content);

                console.log(`Processing ${namespace} (${Object.keys(flat).length} keys)...`);

                const ops = Object.entries(flat).map(([key, value]) => ({
                    updateOne: {
                        filter: { key, locale, namespace },
                        update: {
                            $set: {
                                value,
                                updatedAt: new Date(),
                                source: 'master'
                            }
                        },
                        upsert: true
                    }
                }));

                if (ops.length > 0) {
                    const chunkSize = 500;
                    for (let i = 0; i < ops.length; i += chunkSize) {
                        const chunk = ops.slice(i, i + chunkSize);
                        await collection.bulkWrite(chunk);
                    }
                }
            }
        }
        console.log('\n✓ Sync completed successfully.');
    } finally {
        await client.close();
    }
}

sync().catch(console.error);
