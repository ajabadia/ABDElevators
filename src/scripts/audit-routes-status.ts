import fs from 'fs';
import path from 'path';

/**
 * Script para rastrear el estado de la auditoría de rutas (ERA 8 / FASE 233).
 * Identifica qué rutas han sido modificadas recientemente y prepara el tracking.
 */

const APP_DIR = path.resolve(process.cwd(), 'src/app');
const CUTOFF_TIME = new Date('2026-02-26T13:00:00').getTime();

interface RouteInfo {
    path: string;
    lastModified: string;
    touchedToday: boolean;
}

function scanRoutes(dir: string, result: RouteInfo[] = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanRoutes(fullPath, result);
        } else if (file === 'page.tsx') {
            const lastModified = stat.mtime;
            result.push({
                path: path.relative(process.cwd(), fullPath),
                lastModified: lastModified.toISOString(),
                touchedToday: lastModified.getTime() > CUTOFF_TIME
            });
        }
    }
    return result;
}

async function main() {
    console.log(`🔍 Escaneando rutas modificadas después de las 13:00 (CUTOFF: ${new Date(CUTOFF_TIME).toLocaleString()})...\n`);

    const routes = scanRoutes(APP_DIR);
    const affected = routes.filter(r => r.touchedToday);

    if (affected.length === 0) {
        console.log('✅ No se encontraron rutas modificadas hoy después del cutoff.');
    } else {
        console.log(`🚀 Se encontraron ${affected.length} rutas modificadas:`);
        affected.forEach(r => {
            console.log(`- [MODIFICADA] ${r.path} (${new Date(r.lastModified).toLocaleTimeString()})`);
        });
    }

    // Guardar reporte para referencia
    const reportPath = path.join(process.cwd(), 'audit_report_today.json');
    fs.writeFileSync(reportPath, JSON.stringify(affected, null, 2));
    console.log(`\n💾 Reporte guardado en: ${reportPath}`);
}

main().catch(console.error);
