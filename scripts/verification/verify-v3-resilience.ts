import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// 1. Initial configuration
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import via relative paths to avoid tsconfig alias issues in terminal
import { MongoKnowledgeRepository } from '../src/core/adapters/persistence/MongoKnowledgeRepository';
import { MongoAuditRepository } from '../src/core/adapters/persistence/MongoAuditRepository';
import { PrepareIngestionUseCase } from '../src/core/application/use-cases/PrepareIngestionUseCase';
import { ExecuteIngestionAnalysisUseCase } from '../src/core/application/use-cases/ExecuteIngestionAnalysisUseCase';
import { connectDB } from '../src/lib/db';

async function main() {
    const tenantId = 'elevadores_mx';
    const correlationId = `resilience-v3-test-${Date.now()}`;
    const userEmail = 'superadmin@abd.com';

    console.log(`[INIT] Starting resilience verification test: ${correlationId}`);

    try {
        // 2. Initialize Repositories
        const db = await connectDB();
        const knowledgeRepo = new MongoKnowledgeRepository();
        const auditRepo = new MongoAuditRepository();

        // 3. Initialize Use Cases
        const prepareUseCase = new PrepareIngestionUseCase(knowledgeRepo, auditRepo);
        const executeAnalysisUseCase = new ExecuteIngestionAnalysisUseCase(knowledgeRepo, auditRepo);

        // 4. Load test file
        const testFilePath = path.join(process.cwd(), 'Documentación/ejemplos/ascensores/--pedidos--/pedido - español.pdf');
        if (!fs.existsSync(testFilePath)) {
            throw new Error(`Test file not found at: ${testFilePath}`);
        }
        const buffer = fs.readFileSync(testFilePath);

        // 5. STEP 1: PREPARATION (PENDING -> QUEUED)
        console.log('\n--- [STEP 1: PREPARATION] ---');
        const prepareResult: any = await prepareUseCase.execute({
            buffer,
            filename: `resilience-test-${Date.now()}.pdf`,
            tenantId,
            userEmail,
            correlationId,
            industry: 'elevators',
            environment: 'PRODUCTION'
        });

        console.log('Preparation Result:', JSON.stringify(prepareResult, null, 2));

        if (!prepareResult.success) {
            throw new Error(`PrepareIngestionUseCase failed: ${prepareResult.message}`);
        }

        const docId = prepareResult.docId.toString();

        // 6. Verification of intermediate state
        const asset = await db.collection('knowledge_assets').find({ _id: prepareResult.docId }).next();
        console.log(`\n[CHECK] Asset state after preparation: ${asset?.ingestionStatus}`);

        if (asset?.ingestionStatus !== 'QUEUED') {
            console.log('⚠️ Warning: Expected status QUEUED, but found:', asset?.ingestionStatus);
        }

        // 7. STEP 2: ANALYSIS (QUEUED -> PROCESSING -> COMPLETED)
        console.log('\n--- [STEP 2: ANALYSIS] ---');
        const analysisResult = await executeAnalysisUseCase.execute({
            docId,
            correlationId,
            userEmail,
            environment: 'PRODUCTION',
            maskPii: false,
            userContext: {
                role: 'ADMIN_PLATFORM' as any,
                tenantId,
                tier: 'ENTERPRISE' as any
            }
        });

        console.log('Analysis Result:', JSON.stringify(analysisResult, null, 2));

        // 8. FINAL VERIFICATION
        const finalAsset = await db.collection('knowledge_assets').find({ _id: prepareResult.docId }).next();
        console.log(`\n[CHECK] Final asset state: ${finalAsset?.ingestionStatus}`);

        if (finalAsset?.ingestionStatus === 'COMPLETED') {
            console.log('\n✅ SUCCESS: E2E Resilient Ingestion Flow Verified!');
        } else {
            console.log(`\n❌ FAILURE: Final state is ${finalAsset?.ingestionStatus}`);
        }

    } catch (error: any) {
        console.error('\n❌ CRITICAL TEST ERROR');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

main();
