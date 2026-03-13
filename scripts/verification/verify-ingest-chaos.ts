import { connectDB } from '../../src/lib/db';
import { getTenantCollection } from '../../src/lib/db-tenant';
import { StuckDetector } from '../../src/services/ingest/recovery/StuckDetector';
import { ingestionQueue } from '../../src/services/ops/simple-queue/simple-queue';
import { ObjectId } from 'mongodb';

/**
 * Phase 413: Verification of Ingestion Chaos & Recovery
 * Tests the new StuckDetector logic that recovers jobs stuck in QUEUED state.
 */
async function verifyIngestChaos() {
    console.log('[TEST] Starting Ingest Chaos Verification...');
    const tenantId = 'elevadores_mx';
    const correlationId = `chaos-test-${Date.now()}`;
    const fakeDocId = new ObjectId();

    try {
        await connectDB();
        
        // 1. Setup a fake stuck job in QUEUED state (> 15 mins old)
        console.log(`[TEST] Creating dummy QUEUED job: ${fakeDocId}`);
        const collection = await getTenantCollection('knowledge_assets', undefined, tenantId);
        
        await collection.insertOne({
            _id: fakeDocId,
            tenantId,
            filename: 'chaos-test-doc.pdf',
            ingestionStatus: 'QUEUED',
            attempts: 0,
            correlationId,
            updatedAt: new Date(Date.now() - 20 * 60 * 1000) // 20 minutes ago
        } as any);

        console.log(`[TEST] Initial simple-queue size: ${ingestionQueue.pendingCount()}`);

        // 2. Run the StuckDetector recovery for QUEUED jobs
        console.log('[TEST] Running StuckDetector.recoverStuckQueuedJobs()...');
        const session = { user: { tenantId } } as any;
        const result = await StuckDetector.recoverStuckQueuedJobs(session);
        
        console.log('[TEST] Recovery Result:', result);

        if (result.reEnqueued > 0) {
            console.log('[SUCCESS] Successfully re-enqueued stuck jobs!');
        } else {
            console.error('[FAILURE] No jobs were re-enqueued.');
        }

        console.log(`[TEST] Final simple-queue size: ${ingestionQueue.pendingCount()}`);
        
        // 3. Verify DB state was updated (updatedAt refreshed, attempts incremented)
        const updatedDoc = await collection.findOne({ _id: fakeDocId });
        console.log(`[TEST] Document attempts after recovery: ${updatedDoc?.attempts}`);
        
        if (updatedDoc?.attempts === 1) {
            console.log('[SUCCESS] Attempts counter incremented correctly.');
        } else {
            console.error('[FAILURE] Attempts counter did not increment.');
        }

        // Cleanup
        console.log('[TEST] Cleaning up test data...');
        await collection.deleteOne({ _id: fakeDocId });

    } catch (error) {
        console.error('[TEST ERROR]', error);
    } finally {
        process.exit(0);
    }
}

verifyIngestChaos();
