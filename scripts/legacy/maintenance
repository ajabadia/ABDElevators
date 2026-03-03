
import { connectAuthDB } from "../src/lib/db";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function disableMfa() {
    try {
        console.log("🔌 Connecting to Auth DB...");
        const db = await connectAuthDB();

        const email = "superadmin@abd.com";
        console.log(`🔍 Finding user ${email}...`);

        const user = await db.collection("users").findOne({ email });

        if (!user) {
            console.error("❌ User not found!");
            process.exit(1);
        }

        console.log(`👤 User found. Current MFA status: ${user.mfaEnabled}`);

        const result = await db.collection("users").updateOne(
            { email },
            { $set: { mfaEnabled: false } }
        );

        console.log(`✅ MFA Disabled for ${email}. Modified count: ${result.modifiedCount}`);

        // Verify
        const updatedUser = await db.collection("users").findOne({ email });
        console.log(`🔍 Verified MFA status: ${updatedUser?.mfaEnabled}`);

    } catch (error) {
        console.error("💥 Error:", error);
    } finally {
        process.exit(0);
    }
}

disableMfa();
