
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 1. Load Environment Variables
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

function loadEnv(filePath: string) {
    if (fs.existsSync(filePath)) {
        console.log(`Loading env from ${filePath}`);
        const envConfig = dotenv.parse(fs.readFileSync(filePath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    } else {
        console.log(`Skipping ${filePath} (not found)`);
    }
}

loadEnv(envPath);
loadEnv(envLocalPath);

async function inspect() {
    try {
        const { TranslationService } = await import('../src/lib/translation-service');

        console.log('🧐 Inspecting messages for [es]...');
        const messages = await TranslationService.getMessages('es', 'platform_master');

        console.log('--- REPORTE I18N ---');
        console.log('Root keys found:', Object.keys(messages).join(', '));
        console.log('Knowledge Assets content:', messages['knowledge_assets'] ? '✅ Present' : '❌ MISSING');

        if (messages['knowledge_assets']) {
            console.log('Sample keys inside knowledge_assets:', Object.keys(messages['knowledge_assets']).slice(0, 5).join(', '));
        }

    } catch (error) {
        console.error('❌ Inspection failed:', error);
    } finally {
        setTimeout(() => process.exit(0), 500);
    }
}

inspect();
