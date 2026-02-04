import { hybridSearch } from "../lib/rag-service";
import { randomUUID } from "crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function verifyRag() {
    console.log("=== VERIFICACIÓN LÓGICA RAG (HYBRID SEARCH) ===");

    // Estos IDs son ejemplos, en un test real usaríamos datos de la DB
    const tenantId = "global";
    const query = "fallo motor gearless";
    const correlationId = randomUUID();

    console.log(`Query: "${query}"`);
    console.log(`TenantId: ${tenantId}`);
    console.log(`CorrelationId: ${correlationId}`);
    console.log("------------------------------------------");

    try {
        const results = await hybridSearch(query, tenantId, correlationId, 3);

        if (results.length === 0) {
            console.log("⚠️ No se encontraron resultados. Esto es normal si la base de datos vectorial está vacía o el tenantId no tiene documentos.");
        } else {
            console.log(`✅ Se encontraron ${results.length} resultados.`);
            results.forEach((r, i) => {
                console.log(`\n[${i + 1}] Fuente: ${r.source}`);
                console.log(`    Tipo: ${r.type} | Score: ${r.score?.toFixed(4) || 'N/A'}`);
                console.log(`    Contenido: ${r.text.substring(0, 150)}...`);
            });
        }

    } catch (error: any) {
        console.error("❌ Error durante la ejecución del RAG:", error.message);
        if (error.stack) console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

verifyRag();
