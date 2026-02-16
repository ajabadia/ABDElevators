
import { connectDB } from "../src/lib/db";
import { performTechnicalSearch, performMultilingualSearch, hybridSearch } from "../src/lib/rag-service";
import * as dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TEST_QUERIES = [
    { q: "Freno de seguridad", lang: "es", expected_model: "SCHINDLER" },
    { q: "Fangvorrichtung", lang: "de", expected_model: "THYSSEN" },
    { q: "Safety gear elevator", lang: "en", expected_model: "KONE" },
    { q: "Limitador de velocidad", lang: "es", expected_model: "ALIMAK" }
];

async function runBenchmark() {
    console.log('🚀 Starting RAG Performance Calibration Benchmark...');
    console.log('--------------------------------------------------');

    const tenantId = "global";
    const results: any[] = [];

    for (const queryObj of TEST_QUERIES) {
        const correlationId = crypto.randomUUID();
        console.log(`\n🔍 Query: "${queryObj.q}" (${queryObj.lang})`);

        // 1. Gemini Search (Standard)
        const startGemini = Date.now();
        let geminiResults = [];
        try {
            geminiResults = await performTechnicalSearch(queryObj.q, tenantId, correlationId, 3);
        } catch (e) {
            console.error('   ❌ Gemini Search failed:', (e as Error).message);
        }
        const durationGemini = Date.now() - startGemini;

        // 2. BGE-M3 Search (Multilingual)
        const startBGE = Date.now();
        let bgeResults = [];
        try {
            // Force ENABLE_LOCAL_EMBEDDINGS for the script
            process.env.ENABLE_LOCAL_EMBEDDINGS = 'true';
            bgeResults = await performMultilingualSearch(queryObj.q, tenantId, correlationId, 3);
        } catch (e) {
            console.error('   ❌ BGE-M3 Search failed:', (e as Error).message);
        }
        const durationBGE = Date.now() - startBGE;

        // 3. Hybrid Search
        const startHybrid = Date.now();
        let hybridResults = [];
        try {
            hybridResults = await hybridSearch(queryObj.q, tenantId, correlationId, 3);
        } catch (e) {
            console.error('   ❌ Hybrid Search failed:', (e as Error).message);
        }
        const durationHybrid = Date.now() - startHybrid;

        console.log(`   🔸 Gemini: ${durationGemini}ms (${geminiResults.length} hits)`);
        console.log(`   🔸 BGE-M3: ${durationBGE}ms (${bgeResults.length} hits)`);
        console.log(`   🔸 Hybrid: ${durationHybrid}ms (${hybridResults.length} hits)`);

        results.push({
            query: queryObj.q,
            gemini: { time: durationGemini, hits: geminiResults.length },
            bge: { time: durationBGE, hits: bgeResults.length },
            hybrid: { time: durationHybrid, hits: hybridResults.length }
        });
    }

    console.log('\n--------------------------------------------------');
    console.log('📊 FINAL SUMMARY');
    console.log('--------------------------------------------------');

    const avgGemini = results.reduce((acc, r) => acc + r.gemini.time, 0) / results.length;
    const avgBGE = results.reduce((acc, r) => acc + r.bge.time, 0) / results.length;

    console.log(`Average Latency (Gemini): ${avgGemini.toFixed(2)}ms`);
    console.log(`Average Latency (BGE-M3): ${avgBGE.toFixed(2)}ms`);

    if (avgBGE > avgGemini * 2) {
        console.log('⚠️  WARNING: BGE-M3 is significantly slower than Gemini. Local execution overhead is high.');
    }

    process.exit(0);
}

runBenchmark().catch(err => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
});
