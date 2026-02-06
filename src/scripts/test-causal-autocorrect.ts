import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI || '';
const maskedUri = uri.replace(/\/\/.*@/, '//****:****@');
console.log(`🔌 DB_URI: ${maskedUri.substring(0, 50)}...`);

process.env.SINGLE_TENANT_ID = 'test-tenant-86';

if (!uri) {
    console.error("❌ MONGODB_URI MISSING");
    process.exit(1);
}

import { RagEvaluationService } from '../services/rag-evaluation-service';
import { logEvento } from '../lib/logger';
import { connectDB } from '../lib/db';
import { MongoClient } from 'mongodb';

async function testConnection() {
    console.log("🔍 Testing direct MongoDB connection...");
    try {
        const client = new MongoClient(uri);
        await client.connect();
        console.log("✅ Direct Connection Success!");
        await client.close();
    } catch (err: any) {
        console.error("❌ Direct Connection Failed:", err.message);
    }
}

/**
 * 🧪 Test Script: Causal AI Self-Correction (Phase 86)
 * Validates the judge -> causal analysis -> retry -> re-evaluate loop.
 */
async function testCausalCorrection() {
    await testConnection();
    const correlationId = '550e8400-e29b-41d4-a716-446655440000'; // Real UUID
    const tenantId = 'test-tenant-86';

    console.log(`🚀 Starting Causal AI Test [${correlationId}]...`);

    console.log("📈 Initializing inputs...");
    // 1. Inputs: A query and a "hallucinated" or "incomplete" response
    const query = "¿Cuál es el voltaje de alimentación de la placa ARCA II?";
    const badResponse = "La placa ARCA II funciona con 220V AC directos de red."; // HALLUCINATION: Usually it's low voltage DC
    const contexts = [
        "Manual ARCA II: La placa requiere una alimentación estabilizada de 24V DC (±5%). El transformador de maniobra convierte los 230V AC a bajas tensiones."
    ];

    try {
        // 2. Trigger Evaluation with Auto-Correction
        console.log("⚖️ Calling evaluateQuery...");
        const result = await RagEvaluationService.evaluateQuery(
            correlationId,
            query,
            badResponse,
            contexts,
            tenantId
        );

        console.log("📊 Result received!");

        // 3. Assertions
        if (result.self_corrected) {
            console.log("✅ SUCCESS: Self-correction worked.");
        } else {
            console.log("⚠️ Evaluation finished without correction.");
        }

    } catch (error: any) {
        console.error("💥 CRASH DETECTED 💥");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        if (error.details) {
            console.error("Details:", JSON.stringify(error.details, null, 2));
        }
        if (error.errors) {
            console.error("Zod Errors:", JSON.stringify(error.errors, null, 2));
        }

        // Write to file as well
        fs.appendFileSync('debug.log', `\n--- TEST ERROR ---\n${JSON.stringify({
            message: error.message,
            code: error.code,
            details: error.details,
            errors: error.errors
        }, null, 2)}\n`);
    }
}

// Run if called directly
if (require.main === module) {
    testCausalCorrection().then(() => process.exit(0));
}
