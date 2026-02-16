import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno antes de importar nada que las use
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectAuthDB } from '../src/lib/db';

async function checkUser(email: string) {
    console.log(`\n🔍 Checking DB for: ${email}`);
    try {
        const db = await connectAuthDB();
        const user = await db.collection("users").findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            console.log(`❌ User not found in 'users' collection.`);
            return;
        }

        const details = {
            _id: user._id,
            email: user.email,
            role: user.role,
            mfaEnabled: user.mfaEnabled === true,
            hasMfaSecret: !!user.mfaSecret,
            mfaMethods: user.mfaMethods || [],
            tenantId: user.tenantId,
            id: user.id // Some systems use 'id' instead of '_id'
        };

        console.log("\n👤 USER DETAILS FROM DB:");
        console.log("========================");
        console.log(JSON.stringify(details, null, 2));
        console.log("========================\n");

        // Analizar por qué saltaría mfaPending
        const isPrivileged = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
        const mfaEnabled = user.mfaEnabled === true;
        const wouldTriggerMfaPending = !mfaEnabled && isPrivileged;

        console.log(`🛡️  ANALYSIS:`);
        console.log(`- Privileged Role: ${isPrivileged}`);
        console.log(`- MFA Enabled: ${mfaEnabled}`);
        console.log(`- Would trigger mfaPending (on password login): ${wouldTriggerMfaPending}`);

    } catch (error: any) {
        console.error("\n💥 DATABASE ERROR:", error.message);
    } finally {
        process.exit();
    }
}

const email = process.argv[2] || "ajabadia@gmail.com";
checkUser(email);
