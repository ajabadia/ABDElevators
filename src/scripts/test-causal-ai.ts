import { CausalImpactService } from '../services/causal-impact-service';

/**
 * 🧪 Test Script: Causal AI Verification
 * Valida que el motor causal genere cadenas razonables para diferentes escenarios.
 */
async function runVerification() {
    console.log('🚀 Iniciando verificación de Causal AI...');
    console.log('-------------------------------------------');

    const testCases = [
        {
            finding: 'Corrosión severa en vigas de carga (Sótano 2)',
            context: 'Edificio residencial de 1970, zona costera.'
        },
        {
            finding: 'Filtración activa en cuarto de transformadores',
            context: 'Instalación industrial, riesgo eléctrico detectado.'
        }
    ];

    const tenantId = 'test-verification-tenant';

    for (const testCase of testCases) {
        console.log(`\n🔍 Analizando Hallazgo: "${testCase.finding}"`);
        try {
            const start = Date.now();
            const result = await CausalImpactService.assessImpact(testCase.finding, testCase.context, tenantId);
            const duration = Date.now() - start;

            console.log(`✅ Éxito en ${duration}ms`);
            console.log(`⛓️  Longitud de la cadena: ${result.chain.length} niveles`);
            console.log(`🛡️  Mitigación: ${result.mitigation.action} (Urgencia: ${result.mitigation.urgency})`);

            // Verificaciones básicas
            if (result.chain.length < 2) console.warn('⚠️  Advertencia: Cadena causal demasiado corta.');
            if (!result.mitigation.action) console.error('❌ Error: Falta plan de mitigación.');

        } catch (error) {
            console.error(`❌ Fallo al analizar hallazgo:`, error);
        }
    }

    console.log('\n-------------------------------------------');
    console.log('🏁 Verificación completada.');
}

runVerification().catch(console.error);
