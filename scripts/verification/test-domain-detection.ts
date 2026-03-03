import { DomainRouterService } from '@/services/core/domain-router-service';

async function testDetection() {
    const samples = [
        {
            name: 'Elevators (Technical)',
            text: 'Se requiere calibrar la placa de maniobra ARCA II y revisar la botonera de cabina por falta de iluminación en el shaft.',
            expected: 'ELEVATORS'
        },
        {
            name: 'Legal (Contract)',
            text: 'This agreement is governed by the laws of Spain. The liability clause states that the indemnity shall not exceed the total contract value.',
            expected: 'LEGAL'
        },
        {
            name: 'Banking (Financial)',
            text: 'The asset management ledger shows a significant increase in mortgages and personal loans. Compliance requires a full SWIFT audit.',
            expected: 'BANKING'
        },
        {
            name: 'Insurance (Policy)',
            text: 'La póliza de seguro de vida tiene una cobertura extendida en caso de siniestro. El beneficiario recibirá la prima acumulada.',
            expected: 'INSURANCE'
        }
    ];

    console.log('--- STARTING DOMAIN DETECTION TEST ---');
    const tenantId = 'platform_master';

    for (const sample of samples) {
        console.log(`\nTesting: ${sample.name}...`);
        try {
            const detected = await DomainRouterService.detectIndustry(sample.text, tenantId);
            console.log(`Detected: ${detected} | Expected: ${sample.expected}`);
            if (detected === sample.expected) {
                console.log('✅ MATCH');
            } else {
                console.log('❌ MISMATCH');
            }
        } catch (error: any) {
            console.error(`❌ ERROR testing ${sample.name}:`, error.message);
        }
    }
}

testDetection().catch(console.error);
