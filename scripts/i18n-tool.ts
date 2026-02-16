import { TranslationService } from '../src/lib/translation-service';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const ARGS = process.argv.slice(2);
const COMMAND = ARGS[0];

async function main() {
    console.log('\n--- 🌐 ABD RAG Platform: Unified i18n Tool ---');

    if (!COMMAND || COMMAND === '--help' || COMMAND === '-h') {
        console.log('Uso: npx tsx scripts/i18n-tool.mts <comando> [argumentos]');
        console.log('\nComandos:');
        console.log('  sync-to-db <locale|all>    Sincroniza archivos locales -> MongoDB');
        console.log('  export-to-json <locale>    Exporta MongoDB overrides -> archivos JSON locales');
        console.log('  clear-cache <locale|all>   Limpia la caché de Redis');
        console.log('\nEjemplos:');
        console.log('  npx tsx scripts/i18n-tool.mts sync-to-db es');
        console.log('  npx tsx scripts/i18n-tool.mts export-to-json en');
        process.exit(0);
    }

    try {
        switch (COMMAND) {
            case 'sync-to-db':
                await handleSyncToDb();
                break;
            case 'export-to-json':
                await handleExportToJson();
                break;
            case 'clear-cache':
                await handleClearCache();
                break;
            default:
                console.error(`❌ Comando desconocido: ${COMMAND}`);
                process.exit(1);
        }
    } catch (error: any) {
        console.error('\n❌ Error fatal:', error.message);
        process.exit(1);
    }
}

async function handleSyncToDb() {
    const locale = ARGS[1];
    if (!locale) {
        console.error('❌ Error: Se requiere <locale> o "all"');
        process.exit(1);
    }

    console.log(`🚀 Iniciando sincronización a DB para: ${locale}`);
    if (locale === 'all') {
        const results = await TranslationService.forceSyncAllLocales();
        console.log('✅ Sincronización global completada:', results);
    } else {
        const count = await TranslationService.forceSyncFromLocal(locale);
        console.log(`✅ Sincronización completada para '${locale}': ${count} llaves.`);
    }
}

async function handleExportToJson() {
    const locale = ARGS[1];
    if (!locale) {
        console.error('❌ Error: Se requiere <locale>');
        process.exit(1);
    }

    console.log(`🚀 Exportando de DB a JSON local para: ${locale}`);
    const result = await TranslationService.exportToLocalFiles(locale);
    console.log(`✅ Exportación finalizada. ${result.exported} llaves exportadas en ${result.files.length} archivos.`);
    console.log('Archivos actualizados:', result.files.join(', '));
}

async function handleClearCache() {
    const locale = ARGS[1];
    if (!locale) {
        console.error('❌ Error: Se requiere <locale> o "all"');
        process.exit(1);
    }

    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (!redisUrl) {
        throw new Error('REDIS_URL no encontrada en env');
    }

    const client = new Redis(redisUrl);
    console.log('🔌 Conectado a Redis para limpieza...');

    try {
        if (locale === 'all') {
            const keys = await client.keys('i18n:*');
            if (keys.length > 0) {
                await client.del(...keys);
                console.log(`✅ Limpiadas ${keys.length} llaves globales.`);
            } else {
                console.log('ℹ️ No hay llaves de i18n en caché.');
            }
        } else {
            const keys = await client.keys(`i18n:*:${locale}`);
            if (keys.length > 0) {
                await client.del(...keys);
                console.log(`✅ Limpiadas ${keys.length} llaves para locale '${locale}'.`);
            } else {
                console.log(`ℹ️ No hay llaves para '${locale}' en caché.`);
            }
        }
    } finally {
        await client.quit();
    }
}

main();
