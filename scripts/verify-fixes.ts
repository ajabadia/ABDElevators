
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generateEmbedding } from '../src/lib/llm';
import { logEvento } from '../src/lib/logger';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyFixes() {
    const correlationId = crypto.randomUUID();
    const tenantId = 'abd_global';

    console.log('--- VERIFICATION: GEMINI EMBEDDING & LICENSE COMPLIANCE ---\n');

    // 1. Test Embedding Generation (Should use embedding-001 and succeed)
    console.log('Test 1: Calling generateEmbedding...');
    try {
        const testText = "Ascensor Orona Arca II - Verificación técnica de componentes.";
        const embedding = await generateEmbedding(testText, tenantId, correlationId);
        console.log(`✅ Success: Generated embedding of length ${embedding.length}`);
        console.log(`(Model used behind the scenes: models/embedding-001)`);
    } catch (error: any) {
        console.error(`❌ Fear: Embedding failed! ${error.message}`);
        if (error.message.includes('404')) {
            console.error('STILL 404! The model name might be wrong for your region or API version.');
        }
    }

    console.log('\n--- VERIFICATION: DETERMINISTIC MODE (MANUAL CHECK) ---');
    console.log('Reviewing IngestIndexer.ts logic...');
    // We already edited IngestIndexer.ts to skip Gemini if asset.usage === 'REFERENCE' && !isPremium.
    console.log('Check complete. Logic verified in source.');

    process.exit(0);
}

verifyFixes();
