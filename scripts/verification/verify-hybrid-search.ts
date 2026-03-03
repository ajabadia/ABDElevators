
import { hybridSearch, pureKeywordSearch } from "../src/lib/rag-service";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyHybridSearch() {
    console.log('--- Verifying Hybrid Search (Phase 36) ---');

    const tenantId = "test-tenant";
    const correlationId = "00000000-0000-4000-8000-000000000000";
    const query = "F01 error code"; // Example of technical term that should trigger keyword search

    try {
        console.log(`\n1. Testing pureKeywordSearch for: "${query}"...`);
        const keywordResults = await pureKeywordSearch(query, tenantId, correlationId);
        console.log(`   Found ${keywordResults.length} results via Keyword Search.`);
        if (keywordResults.length > 0) {
            console.log(`   Top Result: "${keywordResults[0].text.substring(0, 100)}..." (Score: ${keywordResults[0].score})`);
        }

        console.log(`\n2. Testing hybridSearch for: "${query}"...`);
        const hybridResults = await hybridSearch(query, tenantId, correlationId);
        console.log(`   Found ${hybridResults.length} results via Hybrid Search (RRF).`);

        hybridResults.forEach((res, i) => {
            console.log(`   [${i + 1}] Score: ${res.score?.toFixed(4) || 'N/A'} | Source: ${res.source} | Text: ${res.text.substring(0, 80)}...`);
        });

        console.log('\n✅ Verification Complete');
    } catch (error) {
        console.error('❌ Verification FAILED:', error);
    } finally {
        process.exit(0);
    }
}

verifyHybridSearch();
