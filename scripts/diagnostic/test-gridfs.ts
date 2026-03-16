
import dotenv from 'dotenv';
import path from 'path';

async function main() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    dotenv.config({ path: envPath });

    console.log('🔍 [DIAGNOSTIC] Testing GridFS connection...');
    
    try {
        const { GridFSUtils } = await import('../../src/lib/gridfs-utils');
        const testBuffer = Buffer.from('Hello GridFS Diagnostic Target Content');
        const tenantId = '000000000000000000000000';
        const docId = 'test_diag_' + Date.now();
        const correlationId = 'DIAG_' + Date.now();

        console.log('📤 Step 1: Attempting saveForProcessing...');
        const blobId = await GridFSUtils.saveForProcessing(testBuffer, tenantId, docId, correlationId);
        console.log(`✅ Success! blobId: ${blobId}`);

        console.log('📥 Step 2: Attempting getForProcessing...');
        const retrieved = await GridFSUtils.getForProcessing(blobId, correlationId);
        console.log(`✅ Success! Retrieved ${retrieved.length} bytes.`);
        
        if (retrieved.toString() === testBuffer.toString()) {
            console.log('✨ Data integrity verified!');
        } else {
            console.error('❌ Integrity check FAILED!');
        }

        console.log('🗑️ Step 3: Cleanup (deleteAfterProcessing)...');
        await GridFSUtils.deleteAfterProcessing(blobId, correlationId);
        console.log('✅ Cleanup successful.');

    } catch (error) {
        console.error('❌ DIAGNOSTIC FAILED:', error);
        process.exit(1);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

main();
