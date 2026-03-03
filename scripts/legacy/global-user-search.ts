import * as dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function search(email: string) {
    const uris = [
        { name: 'MONGODB_URI', uri: process.env.MONGODB_URI },
        { name: 'MONGODB_AUTH_URI', uri: process.env.MONGODB_AUTH_URI },
        { name: 'MONGODB_LOGS_URI', uri: process.env.MONGODB_LOGS_URI }
    ].filter(i => !!i.uri);

    for (const item of uris) {
        console.log(`\n🔎 Searching in ${item.name}...`);
        const client = new MongoClient(item.uri!);
        try {
            await client.connect();
            const dbs = await client.db().admin().listDatabases();
            for (const d of dbs.databases) {
                if (d.name === 'admin' || d.name === 'local' || d.name === 'config') continue;

                const db = client.db(d.name);
                const collections = await db.listCollections().toArray();
                for (const col of collections) {
                    const user = await db.collection(col.name).findOne({ email: email.toLowerCase().trim() });
                    if (user) {
                        console.log(`✅ FOUND in DB: ${d.name}, Collection: ${col.name}`);
                        console.log(JSON.stringify({
                            _id: user._id,
                            email: user.email,
                            role: user.role,
                            mfaEnabled: user.mfaEnabled,
                            hasSecret: !!user.mfaSecret
                        }, null, 2));
                    }
                }
            }
        } catch (e: any) {
            console.error(`❌ Error in ${item.name}: ${e.message}`);
        } finally {
            await client.close();
        }
    }
}

const email = process.argv[2] || "superadmin@abd.com";
search(email);
