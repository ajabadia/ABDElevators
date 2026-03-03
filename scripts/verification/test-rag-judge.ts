import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { RagJudgeService } from '../services/rag-judge-service';

async function testRagJudge() {
    console.log('--- TESTING RAG JUDGE (Phase 104) ---');

    const tenantId = 'global';
    const industry = 'ELEVATORS';
    const query = '¿Cómo se calibra la placa ARCA II?';

    // 1. Escenario: Respuesta FIEL y RELEVANTE
    const goodContext = 'Manual ARCA II: Para calibrar la placa, pulse el botón SW1 durante 3 segundos hasta que el LED parpadee.';
    const goodResponse = 'Para calibrar la placa ARCA II, debes mantener presionado el botón SW1 por 3 segundos hasta ver el parpadeo del LED.';

    console.log('\n--- Probando Respuesta de ALTA CALIDAD ---');
    const evalGood = await RagJudgeService.evaluateResponse(query, goodContext, goodResponse, industry, tenantId);
    console.log('Evaluación:', JSON.stringify(evalGood, null, 2));

    // 2. Escenario: ALUCINACIÓN (Faithfulness baja)
    const hallucinationResponse = 'Para calibrar la placa ARCA II, apague el motor principal y desconecte el cable de red.';

    console.log('\n--- Probando ALUCINACIÓN (Criterio: Faithfulness) ---');
    const evalBad = await RagJudgeService.evaluateResponse(query, goodContext, hallucinationResponse, industry, tenantId);
    console.log('Evaluación:', JSON.stringify(evalBad, null, 2));

    // 3. Escenario: Irrelevante (Relevance baja)
    const irrelevantResponse = 'Los ascensores ARCA II son muy eficientes y silenciosos.';

    console.log('\n--- Probando Respuesta IRRELEVANTE (Criterio: Relevance) ---');
    const evalIrrelevant = await RagJudgeService.evaluateResponse(query, goodContext, irrelevantResponse, industry, tenantId);
    console.log('Evaluación:', JSON.stringify(evalIrrelevant, null, 2));

    console.log('\n✅ Test de Judge RAG completado.');
}

testRagJudge().catch(console.error);
