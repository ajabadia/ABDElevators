import * as dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspect() {
    const uri = process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI;
    const client = new MongoClient(uri!);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Auth');

        const user = await db.collection("users").findOne({ email: "superadmin@abd.com" });
        if (!user) {
            console.log("USER_SEARCH_RESULT: NOT_FOUND");
            return;
        }

        console.log("--- USER RECORD ---");
        console.log("ID:", user._id.toString());
        console.log("EMAIL:", user.email);
        console.log("MFA_ENABLED_IN_USER_DOC:", user.mfaEnabled);

        const config = await db.collection('mfa_configs').findOne({ userId: user._id.toString() });
        console.log("\n--- MFA CONFIG RECORD ---");
        if (config) {
            console.log("ID_IN_CONFIG:", config._id.toString());
            console.log("USER_ID_IN_CONFIG:", config.userId);
            console.log("ENABLED_IN_CONFIG:", config.enabled);
            console.log("HAS_SECRET:", !!config.secret);
            console.log("RECOVERY_CODES_COUNT:", config.recoveryCodes?.length || 0);
        } else {
            console.log("MFA_CONFIG_RESULT: NOT_FOUND_IN_COLLECTION");
        }
    } finally {
        await client.close();
        process.exit();
    }
}

inspect();
