import { SGSIService } from '../../src/services/security/SGSIService';

/**
 * CLI Script to generate SGSI Monthly Evidence
 * Usage: npx tsx scripts/maintenance/generate-evidence.ts --month=3 --year=2026
 */
async function main() {
    const args = process.argv.slice(2);
    const params: Record<string, string> = {};

    args.forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.split('=');
            params[key.replace('--', '')] = value;
        }
    });

    const now = new Date();
    const month = parseInt(params.month) || now.getMonth() + 1;
    const year = parseInt(params.year) || now.getFullYear();

    console.log(`🚀 SGSI Evidence Orchestrator`);
    console.log(`-----------------------------`);
    console.log(`Período: ${month}/${year}`);
    console.log(`Generando reporte...`);

    try {
        const filePath = await SGSIService.generateMonthlyEvidence(year, month);
        console.log(`✅ Reporte generado exitosamente:`);
        console.log(`${filePath}`);
    } catch (error) {
        console.error(`❌ Error al generar el reporte:`, error);
        process.exit(1);
    }
}

main();
