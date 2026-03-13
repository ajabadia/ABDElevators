
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function purgeAll() {
    const uris = {
        MAIN: process.env.MONGODB_URI,
        AUTH: process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI,
    };

    const targetDbName = 'ABDElevators';

    for (const [name, uri] of Object.entries(uris)) {
        if (!uri) continue;
        const client = new MongoClient(uri);
        try {
            await client.connect();
            console.log(`\n--- Cluster ${name} ---`);
            
            const db = client.db(targetDbName);
            const collections = ['knowledge_assets', 'user_documents', 'document_chunks', 'audit_ingestion', 'knowledge_base'];
            
            for (const colName of collections) {
                const col = db.collection(colName);
                const count = await col.countDocuments();
                if (count > 0) {
                    const result = await col.deleteMany({});
                    console.log(`Deleted ${result.deletedCount} documents from ${colName}`);
                } else {
                    console.log(`Collection ${colName} is already empty.`);
                }
            }

        } catch (e) {
            console.error(`Error in ${name}:`, e);
        } finally {
            await client.close();
        }
    }
}

purgeAll();
