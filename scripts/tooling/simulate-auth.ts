import * as dotenv from 'dotenv';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function simulateAuthorize(email: string, password: string, mfaCode?: string) {
    const uri = process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI;
    const client = new MongoClient(uri!);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Auth');
        const user = await db.collection("users").findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            console.log("RESULT: null (User not found)");
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log("RESULT: null (Invalid password)");
            return;
        }

        const mfaEnabled = user.mfaEnabled === true;

        if (mfaEnabled && !mfaCode) {
            console.log("RESULT: Error(MFA_REQUIRED)");
            return;
        }

        if (mfaEnabled && mfaCode) {
            // Simulate verify
            console.log("RESULT: MFA Verification needed");
        }

        console.log("RESULT: Success");
    } catch (e: any) {
        console.log("RESULT: Error(" + e.message + ")");
    } finally {
        await client.close();
        process.exit();
    }
}

// Assuming the user is using the correct password. 
// I don't know the password, but I can check if mfaEnabled is true.
simulateAuthorize("superadmin@abd.com", "super123");
