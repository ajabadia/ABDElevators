import * as dotenv from 'dotenv';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function check(userId: string) {
    const uri = process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI;
    const client = new MongoClient(uri!);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Auth');
        const config = await db.collection('mfa_configs').findOne({ userId });
        console.log("MFA_CONFIG:");
        if (config) {
            console.log(JSON.stringify({
                _id: config._id,
                userId: config.userId,
                enabled: config.enabled,
                hasSecret: !!config.secret,
                recoveryCodesCount: config.recoveryCodes?.length || 0
            }, null, 2));
        } else {
            console.log("❌ NO CONFIG FOUND for userId:", userId);
        }
    } finally {
        await client.close();
        process.exit();
    }
}

const userId = process.argv[2] || "697f33e20db781c139e27313";
check(userId);
