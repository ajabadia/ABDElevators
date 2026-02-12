import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
const tenantId = 'platform_master';

async function fix() {
    if (!uri) {
        console.error('MONGODB_URI no definida');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const translations = db.collection('translations');
        const prompts = db.collection('prompts');

        console.log('--- Corrigiendo i18n keys ---');
        const i18nKeys = [
            { key: 'admin.i18n.notifications.saveSuccess', value: 'Traducciones guardadas correctamente', locale: 'es' },
            { key: 'admin.i18n.notifications.saveSuccess', value: 'Translations saved successfully', locale: 'en' },
            { key: 'admin.i18n.notifications.syncSuccess', value: 'Sincronización completada', locale: 'es' },
            { key: 'admin.i18n.notifications.syncSuccess', value: 'Synchronization completed', locale: 'en' },
            { key: 'admin.i18n.notifications.syncSuccessDesc', value: 'La base de datos se ha actualizado con los archivos locales', locale: 'es' },
            { key: 'admin.i18n.notifications.syncSuccessDesc', value: 'The database has been updated with local files', locale: 'en' }
        ];

        for (const item of i18nKeys) {
            await translations.updateOne(
                { key: item.key, locale: item.locale, tenantId },
                {
                    $set: {
                        value: item.value,
                        namespace: 'admin',
                        isObsolete: false,
                        lastUpdated: new Date()
                    }
                },
                { upsert: true }
            );
            console.log(`- Sincronizada: ${item.key} (${item.locale})`);
        }

        console.log('\n--- Corrigiendo Prompt Variables (Integridad) ---');
        const promptKey = 'I18N_AUTO_TRANSLATE';
        const variables = [
            { name: 'vertical', type: 'string', description: 'Sector industrial (ELEVATORS, etc)', required: true },
            { name: 'sourceLocale', type: 'string', description: 'Idioma origen', required: true },
            { name: 'targetLocale', type: 'string', description: 'Idioma destino', required: true },
            { name: 'translationsToProcess', type: 'json', description: 'Objeto JSON con las llaves a traducir', required: true }
        ];

        const promptResult = await prompts.updateOne(
            { key: promptKey, tenantId },
            {
                $set: {
                    variables,
                    updatedAt: new Date()
                }
            }
        );

        if (promptResult.matchedCount > 0) {
            console.log(`- Variables registradas para el prompt: ${promptKey}`);
        } else {
            console.log(`- ADVERTENCIA: No se encontró el prompt ${promptKey} en la DB para ${tenantId}`);
        }

    } catch (error) {
        console.error('Error durante la corrección:', error);
    } finally {
        await client.close();
    }
}

fix();
