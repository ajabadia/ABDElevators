import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PromptTesterService } from '../services/prompt-tester-service';

async function testPromptTester() {
    console.log('🚀 Iniciando test de PromptTesterService (Phase 83)...');

    const input = {
        template: 'Analiza el siguiente documento de {{vertical}} sobre {{tema}}.',
        variables: {
            vertical: 'Banca',
            tema: 'lavado de dinero'
        },
        tenantId: 'platform_master',
        industry: 'BANKING',
        model: 'gemini-2.5-flash' as const,
        correlationId: 'test-prompt-tester-123'
    };

    try {
        const result = await PromptTesterService.runSimulation(input);
        console.log('✅ Simulación completada:');
        console.log('---');
        console.log(`Modelo: ${result.model}`);
        console.log(`Salida: ${result.output.substring(0, 100)}...`);
        console.log(`Duración: ${result.durationMs}ms`);
        console.log('---');
    } catch (error) {
        console.error('❌ Error en el test:', error);
        process.exit(1);
    }
}

testPromptTester();
