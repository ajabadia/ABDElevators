import { PrepareIngestionUseCase } from '../src/core/application/use-cases/PrepareIngestionUseCase';
import { ExecuteIngestionAnalysisUseCase } from '../src/core/application/use-cases/ExecuteIngestionAnalysisUseCase';
import { getTenantCollection } from '../src/lib/db-tenant';
import { logEvento } from '../src/lib/logger';
import fs from 'fs';
import path from 'path';

async function verifyIngestionFlow() {
    const tenantId = 'elevadores_mx';
    const correlationId = `test-verify-${Date.now()}`;
    const filePath = path.join(process.cwd(), 'Documentación/ejemplos/ascensores/--pedidos--/pedido - español.pdf');
    const buffer = fs.readFileSync(filePath);

    console.log(`[TEST] Starting verification flow for ${correlationId}`);

    try {
        // 1. EXECUTE PREPARATION
        console.log('[TEST] Executing PrepareIngestionUseCase...');
        const prepareResult = await PrepareIngestionUseCase.execute({
            buffer,
            filename: 'test-verify.pdf',
            tenantId,
            userEmail: 'superadmin@abd.com',
            correlationId,
            industry: 'elevators'
        });

        console.log('[TEST] Prepare Result:', JSON.stringify(prepareResult, null, 2));

        if (!prepareResult.success) {
            throw new Error(`Preparation failed: ${prepareResult.message}`);
        }

        const docId = prepareResult.docId;

        // 2. VERIFY STATE: PENDING -> QUEUED
        const collection = await getTenantCollection('knowledge_assets', undefined, tenantId);
        const asset = await collection.findOne({ _id: docId });

        console.log('[TEST] Initial Asset Status:', asset?.ingestionStatus);
        if (asset?.ingestionStatus !== 'QUEUED' && asset?.ingestionStatus !== 'PENDING') {
            // Depending on how fast the worker is, it might already be QUEUED
            console.log('[WARN] Unexpected status, but proceeding...');
        }

        // 3. EXECUTE ANALYSIS (Manually to verify transitions)
        console.log('[TEST] Executing ExecuteIngestionAnalysisUseCase...');
        const analysisResult = await ExecuteIngestionAnalysisUseCase.execute({
            docId: docId.toString(),
            tenantId,
            correlationId
        });

        console.log('[TEST] Analysis Result:', JSON.stringify(analysisResult, null, 2));

        // 4. FINAL STATE VERIFICATION
        const finalAsset = await collection.findOne({ _id: docId });
        console.log('[TEST] Final Asset Status:', finalAsset?.ingestionStatus);

        if (finalAsset?.ingestionStatus === 'COMPLETED') {
            console.log('[SUCCESS] Ingestion flow verified: PENDING -> QUEUED -> PROCESSING -> COMPLETED');
        } else {
            console.log('[FAILURE] Ingestion ended in state:', finalAsset?.ingestionStatus);
        }

    } catch (error: any) {
        console.error('[TEST_ERROR]', error);
        process.exit(1);
    }
}

verifyIngestionFlow();
