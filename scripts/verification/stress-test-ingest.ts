
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import { IngestService } from '@/services/ingest-service';
import { connectDB } from '@/lib/db';

async function runStressTest() {
    console.log("🚀 Starting Ingest Pipeline Stress Test...");

    try {
        await connectDB();
        console.log("✅ Database connected.");
    } catch (e) {
        console.error("❌ Database connection failed. Check .env.local", e);
        process.exit(1);
    }

    const CONCURRENT_UPLOADS = 5;
    const TENANT_ID = "default"; // Use default to ensure prompts exist
    const USER_EMAIL = "stress-tester@example.com";

    console.log(`⚡ Simulating ${CONCURRENT_UPLOADS} concurrent uploads for tenant: ${TENANT_ID}`);

    // Create a dummy PDF buffer (not a real PDF, but enough for MD5 deduplication test)
    // We use a timestamp to ensure uniqueness per run, but same content for concurrent requests
    const uniqueContent = `DUMMY PDF CONTENT FOR STRESS TEST - ${Date.now()}`;
    const buffer = Buffer.from(uniqueContent);

    // Mock File object
    const mockFile = {
        name: `stress-test-doc-${Date.now()}.pdf`,
        size: buffer.length,
        arrayBuffer: async () => {
            // Simulate read delay
            await new Promise(r => setTimeout(r, 100));
            return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        }
    };

    const metadata = {
        type: "stress-test",
        version: "1.0"
    };

    const promises = [];

    // Launch concurrent requests
    for (let i = 0; i < CONCURRENT_UPLOADS; i++) {
        console.log(`▶️ Launching request #${i + 1}...`);
        promises.push(
            IngestService.processDocument({
                file: mockFile,
                metadata,
                tenantId: TENANT_ID,
                userEmail: USER_EMAIL,
                ip: '127.0.0.1',
                userAgent: 'StressTestScript/1.0',
                correlationId: `stress-test-${i}-${Date.now()}`
            })
                .then(res => ({ index: i, result: res }))
                .catch(err => ({ index: i, error: err }))
        );
    }

    const start = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    console.log(`\n🏁 Stress Test Completed in ${duration}ms`);
    console.log("---------------------------------------------------");

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    results.forEach((r: any) => {
        if (r.error) {
            console.error(`❌ Request #${r.index + 1} FAILED:`, r.error.message);
            errorCount++;
        } else {
            const status = r.result.isDuplicate || r.result.isCloned ? "REUSED (Duplicate)" : "PROCESSED (New)";
            console.log(`✅ Request #${r.index + 1} SUCCESS: ${status} - ${r.result.message}`);
            successCount++;
            if (r.result.isDuplicate || r.result.isCloned) duplicateCount++;
        }
    });

    console.log("---------------------------------------------------");
    console.log(`Total Requests: ${CONCURRENT_UPLOADS}`);
    console.log(`Success: ${successCount}`);
    console.log(`Duplicates Detected: ${duplicateCount}`);
    console.log(`Errors: ${errorCount}`);

    if (duplicateCount >= CONCURRENT_UPLOADS - 1) {
        console.log("✅ DEDUPLICATION TEST PASSED: Only 1 (or 0 if pre-existing) full process, others reused.");
    } else {
        console.log("⚠️ DEDUPLICATION WARNING: Fewer duplicates than expected. Race condition might have allowed multiple insertions.");
    }

    process.exit(0);
}

runStressTest();
