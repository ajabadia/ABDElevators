import { authorizeCredentials } from '../lib/auth-utils';
import * as dotenv from 'dotenv';
dotenv.config();

async function runSim() {
    console.log("🏁 Starting Login Simulation...");
    const credentials = {
        email: 'superadmin@abd.com',
        password: 'super123'
    };

    try {
        const result = await authorizeCredentials(credentials);
        console.log("------------------------------------------");
        console.log("RESULT:", JSON.stringify(result, null, 2));
        console.log("------------------------------------------");

        if (result?.mfaPending) {
            console.log("✅ SUCCESS: Simulation returned mfaPending as expected.");
        } else if (result?.id && !result?.mfaPending) {
            console.log("👤 SUCCESS: Simulation logged in directly (MFA might be disabled for this user).");
        } else {
            console.log("❌ FAILURE: result is null or unexpected.");
        }
    } catch (e) {
        console.error("💥 CRASH during simulation:", e);
    }
    process.exit(0);
}

runSim();
