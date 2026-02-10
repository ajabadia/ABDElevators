import * as dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../lib/db';
import { IngestService } from '../services/ingest-service';
import crypto from 'crypto';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
process.env.SINGLE_TENANT_ID = 'abd_global';

async function testIngest() {
    console.log('🧪 REPRODUCTION TEST START');

    try {
        await connectDB();

        const dummyFile = {
            name: 'test-document.pdf',
            size: 100,
            arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer
        };

        const options = {
            file: dummyFile as any,
            metadata: {
                type: 'TEST',
                version: '1.0',
                scope: 'TENANT' as const,
                industry: 'ELEVATORS'
            },
            tenantId: process.env.SINGLE_TENANT_ID || 'abd_global',
            userEmail: 'test@abd.com',
            correlationId: crypto.randomUUID()
        };

        console.log('Calling IngestService.prepareIngest...');
        const result = await IngestService.prepareIngest(options);
        console.log('✅ Prepare Success');

        fs.writeFileSync('repro_data.json', JSON.stringify(result, null, 2));

    } catch (e: any) {
        console.error('❌ TEST FAILED');
        const errorData = {
            message: e.message,
            stack: e.stack,
            code: e.code,
            details: e.details
        };
        fs.writeFileSync('repro_error.json', JSON.stringify(errorData, null, 2));
        console.error(e.message);
    } finally {
        process.exit(0);
    }
}

testIngest();
