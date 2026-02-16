import { TranslationService } from '../src/lib/translation-service';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function verify() {
    console.log('\n--- 🧪 Verificando Aislamiento de TranslationService ---');

    // Simular carga para platform_master
    const esMessages = await TranslationService.getMessages('es', 'platform_master');
    const flatEs = nestToFlat(esMessages);

    const key = 'admin.knowledge.actions.upload';
    console.log(`Valor para ${key} (platform_master): "${flatEs[key]}"`);

    if (flatEs[key] === "" || flatEs[key] === "undefined") {
        console.log('❌ ERROR: Todavía se detecta valor vacío o inválido.');
    } else {
        console.log('✅ ÉXITO: El valor es correcto (probablemente del JSON local o override válido).');
    }

    process.exit(0);
}

function nestToFlat(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    if (!obj) return result;
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, nestToFlat(value, newKey));
        } else {
            result[newKey] = String(value);
        }
    }
    return result;
}

verify();
