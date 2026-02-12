
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testIngestLogic() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const collection = db.collection('knowledge_assets');

        console.log('=== TESTING INGESTION LOGIC (FAILED STATUS PROPAGATION) ===\n');

        // Simulate a FAILED asset that would be created by IngestPreparer on upload failure
        const correlationId = crypto.randomUUID();
        const failedAsset = {
            tenantId: 'abd_global',
            industry: 'ELEVATORS',
            filename: 'test-failed-upload.pdf',
            componentType: 'TECHNICAL',
            model: 'PENDING',
            version: '1.0',
            revisionDate: new Date(),
            status: 'vigente',
            ingestionStatus: 'FAILED',
            error: 'Simulated upload failure from unit test',
            cloudinaryUrl: null,
            cloudinaryPublicId: null,
            fileMd5: 'simulated-hash-' + Date.now(),
            sizeBytes: 12345,
            totalChunks: 0,
            documentTypeId: 'test-type',
            scope: 'GLOBAL',
            environment: 'DEVELOPMENT',
            correlationId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(failedAsset);
        const docId = result.insertedId;
        console.log(`Created failed asset: ${docId}`);

        // Now we would verify that PrepareIngestionUseCase (if called) 
        // would NOT attempt to transition this to QUEUED.
        // Since we can't easily instantiate the Use Case in this script without mocking all repos,
        // we'll manually check the logic and the state transition rules.

        console.log('\nVerifying State Transition Rules:');
        const { StateTransitionValidator } = await import('../services/ingest/observability/StateTransitionValidator');

        try {
            console.log('Attempting invalid transition: FAILED -> QUEUED (should fail)');
            await StateTransitionValidator.validate('FAILED', 'QUEUED', correlationId, 'abd_global', docId.toString());
            console.error('❌ Error: Transition FAILED -> QUEUED was incorrectly allowed!');
        } catch (e: any) {
            console.log('✅ Success: Invalid transition blocked as expected:', e.message);
        }

        // Clean up
        await collection.deleteOne({ _id: docId });
        console.log('\nTest asset cleaned up.');

    } catch (error) {
        console.error('TEST ERROR:', error);
    } finally {
        await client.close();
    }
}

testIngestLogic();
