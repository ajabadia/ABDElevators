import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'ABDElevators'; // Ajustado según contexto
const COLLECTION_NAME = 'translations';

async function seed() {
    console.log('🚀 Iniciando migración DIRECTA de i18n a MongoDB...');

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);

        const locales = ['es', 'en'];

        for (const locale of locales) {
            console.log(`\n📦 Procesando idioma: ${locale}`);

            const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ No se encontró archivo para '${locale}'`);
                continue;
            }

            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const flat = nestToFlat(content);

            const operations = Object.entries(flat).map(([key, value]) => ({
                updateOne: {
                    filter: { key, locale },
                    update: {
                        $set: {
                            key,
                            value,
                            locale,
                            namespace: key.split('.')[0] || 'common',
                            isObsolete: false,
                            lastUpdated: new Date(),
                            environment: 'PRODUCTION'
                        }
                    },
                    upsert: true
                }
            }));

            if (operations.length > 0) {
                console.log(`⏳ Insertando/Actualizando ${operations.length} llaves...`);
                // Batching
                for (let i = 0; i < operations.length; i += 500) {
                    const batch = operations.slice(i, i + 500);
                    await collection.bulkWrite(batch);
                }
                console.log(`✅ Sincronizado '${locale}' con éxito.`);
            }
        }

        // Crear índices para rendimiento
        console.log('\n🔍 Creando índices...');
        await collection.createIndex({ locale: 1, key: 1 }, { unique: true });
        await collection.createIndex({ locale: 1, isObsolete: 1 });

        console.log('\n✨ Migración completada con éxito.');

    } catch (error) {
        console.error('❌ Error fatal en migración:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

function nestToFlat(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
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

seed();
