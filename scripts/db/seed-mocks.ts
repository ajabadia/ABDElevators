import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectDB } from "../../src/lib/db";
import { MongoClient, ObjectId } from "mongodb";

/**
 * 🛠️ Standalone CLI Script for Mock Data Generation
 * This isolates the mock logic from the Next.js runtime.
 *
 * Usage: npm run db:seed
 */

async function seedMocks() {
    console.log("🌱 Starting Mock Data Seeding...");

    try {
        const db = await connectDB();

        // 1. Generate Mock Tenants
        console.log("Generating Mock Tenants...");
        const mockTenants = Array.from({ length: 5 }).map((_, i) => ({
            name: `Mock Tenant ${i + 1}`,
            slug: `mock-tenant-${i + 1}`,
            status: 'active',
            isMock: true,
            createdAt: new Date(),
            metadata: {
                industry: 'Elevators',
                generatedBy: 'CLI Seed Script'
            }
        }));

        const tenantResult = await db.collection('organizations').insertMany(mockTenants);
        console.log(`✅ ${tenantResult.insertedCount} Mock Tenants inserted.`);

        // 2. Find a mock tenant to attach assets to
        const tenant = await db.collection('organizations').findOne({ isMock: true });
        if (!tenant) {
            console.warn("⚠️ No mock tenant found, skipping assets.");
        } else {
            console.log(`Generating Mock Assets for Tenant: ${tenant._id}`);
            const mockAssets = Array.from({ length: 20 }).map((_, i) => ({
                tenantId: tenant._id,
                title: `Mock Document ${i + 1}`,
                type: i % 2 === 0 ? 'PDF' : 'MARKDOWN',
                content: `Synthetic content for mock document ${i + 1}.`,
                isMock: true,
                createdAt: new Date(),
                status: 'indexed'
            }));

            const assetResult = await db.collection('knowledge_assets').insertMany(mockAssets);
            console.log(`✅ ${assetResult.insertedCount} Mock Assets inserted.`);
        }

        console.log("🌟 Seeding completed successfully.");
        process.exit(0);

    } catch (error) {
        console.error("❌ MOCK_SEED_ERROR:", error);
        process.exit(1);
    }
}

seedMocks();
