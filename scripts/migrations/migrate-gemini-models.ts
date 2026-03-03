
import { connectDB } from '../src/lib/db';
import { AI_MODEL_IDS } from '../packages/platform-core/src/constants/ai-models';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateGeminiModels() {
    console.log('🚀 Iniciando migración de modelos Gemini (1.5 -> 2.5)...');

    try {
        const db = await connectDB();

        // 1. Migrar colección 'prompts'
        const promptsCollection = db.collection('prompts');
        const promptResult = await promptsCollection.updateMany(
            { model: { $regex: /gemini-1\.5-flash/i } },
            { $set: { model: AI_MODEL_IDS.GEMINI_2_5_FLASH, updatedAt: new Date() } }
        );
        console.log(`✅ Colección 'prompts': ${promptResult.modifiedCount} documentos actualizados.`);

        const promptProResult = await promptsCollection.updateMany(
            { model: { $regex: /gemini-1\.5-pro/i } },
            { $set: { model: AI_MODEL_IDS.GEMINI_2_5_PRO, updatedAt: new Date() } }
        );
        console.log(`✅ Colección 'prompts': ${promptProResult.modifiedCount} documentos (Pro) actualizados.`);

        // 2. Migrar colección 'ai_configs'
        const aiConfigsCollection = db.collection('ai_configs');

        const configDefaultResult = await aiConfigsCollection.updateMany(
            { defaultModel: { $regex: /gemini-1\.5-flash/i } },
            { $set: { defaultModel: AI_MODEL_IDS.GEMINI_2_5_FLASH, updatedAt: new Date() } }
        );
        console.log(`✅ Colección 'ai_configs' (default): ${configDefaultResult.modifiedCount} documentos actualizados.`);

        const configFallbackResult = await aiConfigsCollection.updateMany(
            { fallbackModel: { $regex: /gemini-1\.5-flash/i } },
            { $set: { fallbackModel: AI_MODEL_IDS.GEMINI_2_5_FLASH, updatedAt: new Date() } }
        );
        console.log(`✅ Colección 'ai_configs' (fallback): ${configFallbackResult.modifiedCount} documentos actualizados.`);

        // Pro
        await aiConfigsCollection.updateMany(
            { defaultModel: { $regex: /gemini-1\.5-pro/i } },
            { $set: { defaultModel: AI_MODEL_IDS.GEMINI_2_5_PRO, updatedAt: new Date() } }
        );
        await aiConfigsCollection.updateMany(
            { fallbackModel: { $regex: /gemini-1\.5-pro/i } },
            { $set: { fallbackModel: AI_MODEL_IDS.GEMINI_2_5_PRO, updatedAt: new Date() } }
        );

        console.log('\n🎉 Migración completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

migrateGeminiModels();
