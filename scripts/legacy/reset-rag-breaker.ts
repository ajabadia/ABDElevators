import { resetGeminiCircuitBreaker } from '../src/lib/resilience';
import { callGeminiMini } from '../src/lib/llm';
import { AI_MODEL_IDS } from '../src/lib/constants/ai-models';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function resetAndTest() {
    try {
        console.log("🛠️ Starting Circuit Breaker Reset & Verification...");

        // 1. Reset the breaker
        resetGeminiCircuitBreaker();

        // 2. Test call to gemini-2.5-flash (which we know is available and corrected to v1beta)
        const tenantId = process.env.SINGLE_TENANT_ID || 'demo-tenant';
        const correlationId = 'RESET-VERIFY-' + Date.now();
        const model = AI_MODEL_IDS.GEMINI_2_5_FLASH;

        console.log(`📡 Sending test call to ${model} (via v1beta)...`);

        const response = await callGeminiMini("Respond briefly: Is the circuit closed?", tenantId, {
            correlationId,
            model
        });

        console.log(`✅ Success! Response: ${response}`);
        console.log("🚀 RAG Engine should be operational now.");
        process.exit(0);
    } catch (error: any) {
        console.error(`❌ Reset/Test Failed:`, error.message);
        if (error.message.includes("circuit breaker is open")) {
            console.log("⚠️ Circuit breaker is still open. Reset might need a small delay or more aggressive clearing.");
        }
        process.exit(1);
    }
}

resetAndTest();
