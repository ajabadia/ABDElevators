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
        const db = client.db();
        const user = await db.collection("users").findOne({ email: "superadmin@abd.com" });
        if (user) {
            console.log("USER_FOUND");
            console.log(`EMAIL: ${user.email}`);
            console.log(`ROLE: ${user.role}`);
            console.log(`MFA_ENABLED: ${user.mfaEnabled}`);
            console.log(`HAS_SECRET: ${!!user.mfaSecret}`);
        } else {
            console.log("USER_NOT_FOUND");
        }
    } finally {
        await client.close();
        process.exit();
    }
}

check();
