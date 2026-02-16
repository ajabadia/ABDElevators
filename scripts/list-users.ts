import * as dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function check() {
    const uri = process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error("No MongoDB URI found");
        process.exit(1);
    }
    const client = new MongoClient(uri);
    try {
        await client.connect();
        // Explicitly use ABDElevators-Auth as in src/lib/db.ts
        const db = client.db('ABDElevators-Auth');

        console.log("COLLECTIONS:");
        const collections = await db.listCollections().toArray();
        collections.forEach(c => console.log(`- ${c.name}`));

        const users = await db.collection("users").find({}, { projection: { email: 1, role: 1, mfaEnabled: 1, mfaSecret: 1 } }).toArray();
        console.log("\nUSERS_LIST:");
        users.forEach(u => console.log(`- ${u.email} (${u.role}) MFA: ${u.mfaEnabled}, HAS_SECRET: ${!!u.mfaSecret}`));
    } catch (e: any) {
        console.error("ERROR:", e.message);
    } finally {
        await client.close();
        process.exit();
    }
}

check();
