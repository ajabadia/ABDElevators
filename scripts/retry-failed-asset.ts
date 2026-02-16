
import { IngestService } from '../src/services/ingest-service';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key: string) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

process.env.MONGODB_URI = getEnv('MONGODB_URI');
process.env.MONGODB_AUTH_URI = getEnv('MONGODB_AUTH_URI');
process.env.MONGODB_LOGS_URI = getEnv('MONGODB_LOGS_URI');
process.env.CLOUDINARY_URL = getEnv('CLOUDINARY_URL');
process.env.GEMINI_API_KEY = getEnv('GEMINI_API_KEY');

const docId = process.argv[2];

if (!docId) {
    console.error('Please provide a document ID');
    process.exit(1);
}

async function retry() {
    console.log(`Retrying ingestion for ${docId}...`);
    try {
        const result = await IngestService.executeAnalysis(docId, {
            userEmail: 'retry_script@abd.com',
            correlationId: 'manual_retry_' + Date.now()
        });
        console.log('Ingestion successful:', result);
    } catch (e: any) {
        console.error('Ingestion failed:', e.message);
        console.error(e.stack);
    }
    process.exit(0);
}

retry();
