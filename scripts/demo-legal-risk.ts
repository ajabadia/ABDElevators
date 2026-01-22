import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { RiskService } from '../src/lib/risk-service';
import * as crypto from 'crypto';

// Forzar tenant para ejecución en script (bypass auth())
process.env.SINGLE_TENANT_ID = 'demo_legal_tenant';

async function runLegalDemo() {
    console.log('🚀 Iniciando Simulación Multi-Industria: SECTOR LEGAL\n');

    const correlacion_id = crypto.randomUUID();
    const tenantId = 'bufete_perez_legal';
    const industry = 'LEGAL';

    // 1. EL CASO: Un fragmento de contrato de servicios
    const contractSnippet = `
        CONTRATO DE SERVICIOS PROFESIONALES
        ...
        CLÁUSULA 8: EXCLUSIVIDAD. El Prestador se compromete a no trabajar para ningún competidor 
        del Cliente en todo el territorio europeo por un periodo de 7 años tras la finalización 
        del presente contrato.
        ...
        CLÁUSULA 12: LIMITACIÓN DE RESPONSABILIDAD. El Prestador no tendrá límite de responsabilidad 
        por daños indirectos o lucro cesante derivados de negligencia leve.
    `;

    // 2. EL CONTEXTO RAG: Política interna de cumplimiento del bufete
    const legalPolicyContext = `
        MANUAL DE CUMPLIMIENTO INTERNO (v2.1)
        - Política de Exclusividad: Las cláusulas de no competencia no deben exceder los 2 años 
          según la normativa laboral vigente y la política de ética del bufete.
        - Política de Responsabilidad: Siempre se debe incluir un "Liability Cap" (límite de 
          responsabilidad) equivalente al 100% del valor anual del contrato para evitar riesgos 
          financieros catastróficos.
    `;

    console.log('🔍 Analizando contrato legal con el Risk Engine...');
    console.log('--------------------------------------------------');

    try {
        const riesgos = await RiskService.analyzeRisks(
            contractSnippet,
            legalPolicyContext,
            industry as any,
            tenantId,
            correlacion_id
        );

        if (riesgos.length === 0) {
            console.log('✅ No se detectaron riesgos. El contrato cumple las políticas.');
        } else {
            console.log(`⚠️ SE DETECTARON ${riesgos.length} RIESGOS CRÍTICOS:\n`);
            riesgos.forEach((r, i) => {
                console.log(`${i + 1}. [${r.severidad}] ${r.tipo}`);
                console.log(`   MENSAJE: ${r.mensaje}`);
                console.log(`   REF. RAG: ${r.referencia_rag}`);
                console.log(`   SUGERENCIA: ${r.sugerencia}\n`);
            });
        }

    } catch (error: any) {
        console.error('❌ Error en la simulación:', error);
    }
}

runLegalDemo();
