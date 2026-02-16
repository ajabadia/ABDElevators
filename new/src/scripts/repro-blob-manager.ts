
import { BlobStorageService } from '../services/storage/BlobStorageService';
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function repro() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();

        // Exact minimal technical session from IngestService.ts
        const technicalSession = {
            session: undefined, // mongo session
            user: {
                tenantId: 'platform_master',
                role: 'SUPER_ADMIN',
                email: 'technical-worker@abd-elevators.com' // Added common sense email
            }
        };

        const buffer = Buffer.from('repro-test-tech-session-' + Date.now());
        const metadata = {
            filename: 'repro-tech.pdf',
            mimeType: 'application/pdf'
        };
        const context = {
            tenantId: 'test-tenant',
            correlationId: 'repro-corr-' + Date.now(),
            source: 'SYSTEM' as const
        };

        console.log('--- Calling getOrCreateBlob with Technical Session ---');
        try {
            const result = await BlobStorageService.getOrCreateBlob(buffer, metadata, context, technicalSession);
            console.log('Result:', JSON.stringify(result, null, 2));
        } catch (error: any) {
            console.error('FAILED with error:', error.message);
            console.error('Stack:', error.stack);
            fs.writeFileSync('repro_blob_error_tech.json', JSON.stringify({
                message: error.message,
                stack: error.stack
            }, null, 2));
        }

    } catch (error) {
        console.error('Connection error:', error);
    } finally {
        await client.close();
    }
}

repro();
