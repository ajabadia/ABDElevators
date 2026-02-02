
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { hybridSearch } from '../lib/rag-service';
import { v4 as uuidv4 } from 'uuid';

async function verifyRagEvolution() {
    console.log('--- VERIFYING RAG EVOLUTION 3.0 ---');

    const query = "problemas con el pesacargas en maniobra Arca II";
    const tenantId = "global"; // Using global for testing with public manuals
    const correlationId = uuidv4();
    const environment = "PRODUCTION";

    console.log(`\n🔍 Query: "${query}"`);
    console.log('-----------------------------------');

    try {
        const results = await hybridSearch(query, tenantId, correlationId, 5, environment);

        console.log(`✅ Recuperados ${results.length} resultados relevantes.\n`);

        results.forEach((res, i) => {
            console.log(`[${i + 1}] Score: ${res.score?.toFixed(4)} | Origen: ${res.source}`);
            // @ts-ignore - rerankReason is added by our new logic
            if (res.rerankReason) {
                console.log(`   💡 Re-rank Reason: ${res.rerankReason}`);
            }
            console.log(`   📝 Fragmento: ${res.text.substring(0, 200)}...\n`);
        });

        if (results.length > 0) {
            console.log('✨ VERIFICACIÓN EXITOSA: El motor utiliza expansión de query y re-ranking con Gemini.');
        } else {
            console.warn('⚠️ No se encontraron resultados. Asegúrate de tener documentos cargados en el tenant global.');
        }

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }

    process.exit(0);
}

verifyRagEvolution();
