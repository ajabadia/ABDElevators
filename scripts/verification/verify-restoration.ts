import { IngestPreparer } from '../src/services/ingest/IngestPreparer';
import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyRestoration() {
    const filename = "Real Decreto 203-2016 - BOE-A-2016-4953-consolidado.pdf";
    const tenantId = "abd_global";
    const userEmail = "superadmin@abd.com";

    const url = "https://res.cloudinary.com/ds81rqpk4/raw/upload/v1770656766/abd-rag-platform/tenants/abd_global/documentos-rag/1770656765021_Real%20Decreto%20203-2016%20-%20BOE-A-2016-4953-consolidado.pdf";

    try {
        console.log('Fetching buffer from Cloudinary to match MD5...');
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());

        const mockFile = {
            name: filename,
            size: buffer.length,
            arrayBuffer: async () => buffer.buffer as ArrayBuffer
        };

        const session = {
            user: {
                id: 'test-user-id',
                email: userEmail,
                tenantId: tenantId,
                role: 'ADMIN'
            }
        };

        const options: any = {
            file: mockFile,
            metadata: {
                type: 'LEGAL',
                version: '1.0',
                scope: 'TENANT'
            },
            tenantId,
            userEmail,
            environment: 'PRODUCTION',
            correlationId: 'test-restoration-' + Date.now(),
            session
        };

        console.log('Calling IngestPreparer.prepare()...');
        const result = await IngestPreparer.prepare(options);

        console.log('Result:', JSON.stringify(result, null, 2));

        // Verify in DB
        const db = await connectDB();
        const asset = await db.collection('knowledge_assets').findOne({ _id: result.docId as any }, { includeDeleted: true } as any);

        if (asset && !asset.deletedAt && asset.ingestionStatus === 'PENDING') {
            console.log('✅ SUCCESS: Asset restored successfully.');
        } else {
            console.log('❌ FAILURE: Asset state is incorrect.', asset);
        }

    } catch (e) {
        console.error('❌ Error during verification:', e);
    } finally {
        process.exit(0);
    }
}

verifyRestoration();
