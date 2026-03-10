import path from 'node:path';
import { connectDB, connectConfigDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function auditGlobalTranslations() {
    try {
        console.log('--- Auditing Global Translations (abd-rag-ascensores) ---');
        const mainDb = await connectDB();
        const configDb = await connectConfigDB();

        // El MONGODB_URI apunta al cluster 'pruebas', DB 'pruebas' según .env.local 
        // pero la captura muestra 'abd-rag-ascensores'. 
        // Vamos a verificar qué base de datos está usando realmente connectDB()
        console.log('Main DB Name:', mainDb.databaseName);

        const globalTranslations = mainDb.collection('translations');
        const count = await globalTranslations.countDocuments();
        console.log(`- Translations in Main DB: ${count} documents`);

        if (count > 0) {
            const sample = await globalTranslations.findOne({});
            console.log('Sample document:', JSON.stringify(sample, null, 2));
        }

        const configTranslations = configDb.collection('translations');
        const configCount = await configTranslations.countDocuments();
        console.log(`- Translations in Config DB: ${configCount} documents`);

        await mainDb.client.close();
        await configDb.client.close();
    } catch (error: any) {
        console.error('❌ Failed to audit global translations:', error.message);
    }
}

auditGlobalTranslations();
