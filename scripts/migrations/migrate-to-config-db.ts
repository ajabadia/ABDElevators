import fs from 'node:fs';
import path from 'node:path';
import { ObjectId } from 'mongodb';
import { connectConfigDB, connectLogsDB } from '../../packages/platform-core/src/server/db';
import { logEvento } from '../../packages/platform-core/src/server/logger';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Script de migración flexible.
 * Lee archivos JSON de una carpeta o un archivo individual
 * e inserta los datos en la base de datos CONFIG o LOGS.
 * 
 * Uso: npx tsx scripts/migrations/migrate-db.ts <ruta> [--db=CONFIG|LOGS] [--clean]
 */
async function migrateDB() {
    const targetPath = process.argv[2] || 'temp_migration_data/';
    const dbTypeArg = process.argv.find(arg => arg.startsWith('--db='))?.split('=')[1] || 'CONFIG';
    const cleanStart = process.argv.includes('--clean');
    const correlationId = crypto.randomUUID();

    if (!fs.existsSync(targetPath)) {
        process.stdout.write(`❌ Error: La ruta ${targetPath} no existe.\n`);
        process.exit(1);
    }

    process.stdout.write(`🚀 Iniciando migración a ${dbTypeArg} desde: ${targetPath}\n`);

    try {
        let db;
        if (dbTypeArg === 'LOGS') {
            const logsUri = process.env.MONGODB_LOGS_URI || 'NO_DEFINIDA';
            const redactedUri = logsUri.replace(/:([^@]+)@/, ':****@');
            process.stdout.write(`🔗 Conectando a LOGS: ${redactedUri}\n`);
            db = await connectLogsDB();
        } else {
            const configUri = process.env.MONGODB_CONFIG_URI || 'NO_DEFINIDA';
            const redactedUri = configUri.replace(/:([^@]+)@/, ':****@');
            process.stdout.write(`🔗 Conectando a CONFIG: ${redactedUri}\n`);
            db = await connectConfigDB();
        }

        process.stdout.write(`📂 Base de Datos Destino: ${db.databaseName}\n`);

        const isDirectory = fs.lstatSync(targetPath).isDirectory();
        const files = isDirectory
            ? fs.readdirSync(targetPath).filter(f => f.endsWith('.json'))
            : [path.basename(targetPath)];

        const baseDir = isDirectory ? targetPath : path.dirname(targetPath);

        for (const file of files) {
            // Manejar prefijo ABDElevators. o similares
            let collectionName = path.basename(file, '.json');
            // Limpieza de prefijos comunes de exportación
            if (collectionName.includes('.')) {
                const parts = collectionName.split('.');
                collectionName = parts[parts.length - 1]; // Tomar la última parte
            }

            const filePath = path.join(baseDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            let data = JSON.parse(content);

            if (!Array.isArray(data)) {
                process.stdout.write(`⚠️  Saltando ${file}: El contenido debe ser un array de documentos.\n`);
                continue;
            }

            // Transformar Extended JSON ($oid, $date) a tipos nativos de MongoDB recursivamente
            const transformDocs = (doc: any): any => {
                if (Array.isArray(doc)) return doc.map(transformDocs);
                if (doc !== null && typeof doc === 'object') {
                    if (doc.$oid) return new ObjectId(doc.$oid);
                    if (doc.$date) return new Date(doc.$date);

                    const newDoc: any = {};
                    for (const key in doc) {
                        newDoc[key] = transformDocs(doc[key]);
                    }
                    return newDoc;
                }
                return doc;
            };

            const transformedData = data.map(transformDocs);

            process.stdout.write(`📦 Procesando ${transformedData.length} documentos para: ${collectionName}...\n`);

            const collection = db.collection(collectionName);

            if (cleanStart) {
                const deleteResult = await collection.deleteMany({});
                process.stdout.write(`   🧹 Colección ${collectionName} limpiada (${deleteResult.deletedCount} eliminados).\n`);
            }

            if (transformedData.length > 0) {
                try {
                    await collection.insertMany(transformedData, { ordered: false });
                    process.stdout.write(`✅  ${collectionName} importado con éxito.\n`);
                } catch (insertError: any) {
                    if (insertError.code === 11000 || insertError.writeErrors) {
                        process.stdout.write(`⚠️  ${collectionName}: Algunos documentos ya existen, se han saltado duplicados.\n`);
                    } else {
                        throw insertError;
                    }
                }
            }

            await logEvento({
                level: 'INFO',
                source: `MIGRATION_${dbTypeArg}`,
                action: 'IMPORT_COLLECTION',
                message: `Importada colección ${collectionName} (${transformedData.length} docs) a ${dbTypeArg}`,
                correlationId,
                details: { collection: collectionName, count: transformedData.length }
            });
        }

        process.stdout.write('\n✨ Migración completada con éxito.\n');
        process.exit(0);
    } catch (error) {
        process.stdout.write(`\n❌ Error durante la migración: ${error instanceof Error ? error.message : String(error)}\n`);
        process.exit(1);
    }
}

migrateDB();
