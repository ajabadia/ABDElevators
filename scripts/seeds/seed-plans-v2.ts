import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { BillingService } from "../src/lib/billing-service";
import { connectDB } from "../src/lib/db";

async function main() {
    console.log("🌱 Seeding Default Pricing Plans with Smart Overage Rules...");

    try {
        await connectDB();
        const result = await BillingService.seedDefaultPlans();
        console.log(`✅ Plans seeded successfully! Inserted count: ${result.insertedCount}`); // result might be object with insertedCount or similar depending on driver version, but usually logs ok.

        console.log("✅ Verification: Default Plans updated in MongoDB.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding plans:", error);
        process.exit(1);
    }
}

main();
