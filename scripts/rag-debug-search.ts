
import { connectDB } from '../src/lib/db';
import { KeywordSearchService } from '../packages/rag-engine/src/keyword-search';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * 🛠️ RAG Debug Search Utility v2
 * Proposito: Verificar por que la búsqueda RAG devuelve 0 resultados.
 * Pruebe especialmente el aislamiento por industria.
 */
async function debugSearch(searchTerm: string) {
    const correlationId = `DEBUG-${Date.now()}`;
    const tenantId = process.env.SINGLE_TENANT_ID || 'demo-tenant';
    const env = 'PRODUCTION';

    console.log(`\n🚀 [TRACE] Starting RAG Debug Search for term: "${searchTerm}"`);

    try {
        const db = await connectDB();
        const collection = db.collection('document_chunks');

        const testIndustries = ['ELEVATORS', 'GENERIC'];

        for (const industry of testIndustries) {
            console.log(`\n--- 🧪 TESTING INDUSTRY: ${industry} ---`);

            // --- STEP 1: RAW MONGODB SEARCH ---
            const queryMatch = {
                chunkText: { $regex: searchTerm, $options: 'i' },
                tenantId: tenantId,
                industry: industry,
                environment: env
            };
            console.log(`📂 [TRACE] Filter: { industry: "${industry}", ... }`);

            const rawResults = await collection.find(queryMatch).limit(1).toArray();
            console.log(`✅ [TRACE] Raw search: Found ${rawResults.length} matches.`);

            // --- STEP 2: OFFICIAL KEYWORD SEARCH API ---
            console.log(`🔎 [TRACE] Calling pureKeywordSearch with industry="${industry}"...`);
            const officialResults = await KeywordSearchService.pureKeywordSearch(
                searchTerm,
                tenantId,
                correlationId,
                5,
                industry,
                env
            );

            console.log(`✅ [TRACE] Official API: Returned ${officialResults.length} results.`);
        }

        console.log(`\n📊 [DIAGNOSTIC CONCLUSION]`);
        console.log(`Si ELEVATORS devuelve resultados pero GENERIC devuelve 0, el problema es que el DomainRouter`);
        console.log(`estaría fallando (posiblemente por el Circuit Breaker abierto) y cayendo a GENERIC.`);

    } catch (err: any) {
        console.error(`\n❌ [ERROR] ${err.message}`);
    }

    process.exit(0);
}

const args = process.argv.slice(2);
const term = args[0] || 'ascensor';
debugSearch(term);
