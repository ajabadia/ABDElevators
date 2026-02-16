
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// IMPORTANT: Set this to avoid db-tenant trying to import auth.ts
process.env.SINGLE_TENANT_ID = 'global';

/**
 * Script de Verificación de Caché Semántico
 */
async function run() {
    // Dynamic import to ensure process.env.SINGLE_TENANT_ID is set before any static imports in rag-service
    const { hybridSearch } = await import('../lib/rag-service');
    const { v4: uuidv4 } = await import('uuid');

    console.log('--- VERIFYING SEMANTIC CACHE (PHASE 33) ---');

    const query = "mantenimiento cabina ascensor Arca";
    const tenantId = "global";
    const environment = "PRODUCTION";
    const correlationId = uuidv4();

    console.log(`\n🔍 Query: "${query}"`);
    console.log('-------------------------------------------');

    try {
        // 1. Primer intento (Probable CACHE MISS)
        console.log('🚀 Iniciando búsqueda 1 (Esperando fallo de caché)...');
        const start1 = Date.now();
        const results1 = await hybridSearch(query, tenantId, correlationId, 3, environment);
        const duration1 = Date.now() - start1;
        console.log(`⏱️ Búsqueda 1 completada en ${duration1}ms (MISS esperado)`);

        // Esperar un poco para asegurar que la persistencia asíncrona terminó (aunque Redis es rápido)
        await new Promise(r => setTimeout(r, 1500));

        // 2. Segundo intento (Probable CACHE HIT)
        console.log('\n🚀 Iniciando búsqueda 2 (Esperando CACHE HIT)...');
        const start2 = Date.now();
        const results2 = await hybridSearch(query, tenantId, correlationId, 3, environment);
        const duration2 = Date.now() - start2;
        console.log(`⏱️ Búsqueda 2 completada en ${duration2}ms (HIT esperado)`);

        // 3. Verificación
        if (duration2 < duration1 && duration2 < 1500) {
            console.log('\n✅ ÉXITO: La segunda búsqueda fue significativamente más rápida.');
            console.log(`📉 Reducción de latencia: ${((duration1 - duration2) / duration1 * 100).toFixed(1)}%`);
        } else {
            console.warn('\n⚠️ ADVERTENCIA: La mejora de rendimiento no fue la esperada. Revisa los logs de Redis.');
            console.log(`Duración 1: ${duration1}ms, Duración 2: ${duration2}ms`);
        }

        if (results1.length === results2.length && results1[0]?.text === results2[0]?.text) {
            console.log('✅ ÉXITO: Los resultados son idénticos.');
        } else {
            console.error('❌ ERROR: Los resultados difieren entre la versión cacheada y la original.');
        }

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }

    process.exit(0);
}

run();
