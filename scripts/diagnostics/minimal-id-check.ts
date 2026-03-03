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
        if (!user) return;
        console.log("USER_ID_STR:" + user._id.toString());
        const config = await db.collection('mfa_configs').findOne({ userId: user._id.toString() });
        if (config) {
            console.log("CONFIG_USER_ID_STR:" + config.userId);
            console.log("CONFIG_ENABLED:" + config.enabled);
        } else {
            console.log("CONFIG_NOT_FOUND");
        }
    } finally {
        await client.close();
        process.exit();
    }
}
inspect();
