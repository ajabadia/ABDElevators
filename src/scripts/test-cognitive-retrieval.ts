import { IngestService } from '@/services/ingest/IngestService';
import { connectDB } from '@/lib/db';
import { RagService } from '@/services/core/RagService';
import { ObjectId } from 'mongodb';

async function testCognitiveRetrievalOptimized() {
    console.log('--- STARTING COGNITIVE RETRIEVAL TEST (OPTIMIZED) ---');

    const db = await connectDB();
    const knowledgeAssetsCollection = db.collection('knowledge_assets');
    const documentChunksCollection = db.collection('document_chunks');

    const testFilename = 'manual_test_optimized_' + Date.now() + '.pdf';
    const testAsset = {
        tenantId: 'platform_master',
        filename: testFilename,
        cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        componentType: 'manual',
        version: '1.0',
        revisionDate: new Date(),
        status: 'vigente',
        ingestionStatus: 'PENDING',
        industry: 'ELEVATORS',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const insertResult = await knowledgeAssetsCollection.insertOne(testAsset);
    const docId = insertResult.insertedId.toString();

    console.log(`Created test asset: ${docId}`);

    try {
        console.log('Executing executeAnalysis...');
        await IngestService.executeAnalysis(docId, {
            userEmail: 'test@example.com',
            correlationId: 'test-cognitive-opt-' + Date.now()
        });

        // 1. Verificar Colección Assets
        const updatedAsset = await knowledgeAssetsCollection.findOne({ _id: new ObjectId(docId) });
        console.log('\n--- ASSET VERIFICATION ---');
        console.log('Context Header in Asset:', updatedAsset?.contextHeader ? '✅ FOUND' : '❌ MISSING');

        // 2. Verificar Colección Chunks (NO debe tener el header en el texto guardado)
        const chunk = await documentChunksCollection.findOne({ sourceDoc: testFilename });
        console.log('\n--- CHUNK VERIFICATION (STORAGE) ---');
        console.log('Chunk Text includes "[CONTEXTO":', chunk?.chunkText.includes('[CONTEXTO') ? '❌ FAILED (Redundant)' : '✅ OK (Clean)');

        // 3. Verificar RAG (DEBE tener el header inyectado al vuelo)
        console.log('\n--- RAG VERIFICATION (RETRIEVAL) ---');
        const searchResults = await RagService.performTechnicalSearch(
            'motor arca',
            'platform_master',
            'test-query-' + Date.now(),
            1,
            'ELEVATORS'
        );

        if (searchResults.length > 0) {
            const result = searchResults[0];
            console.log('Enriched Result Text includes "[CONTEXTO":', result.text.includes('[CONTEXTO') ? '✅ OK (Join Success)' : '❌ FAILED (Missing Context)');
            console.log('Preview:', result.text.substring(0, 200) + '...');
        } else {
            console.log('⚠️ No search results found (check index/content).');
        }

    } catch (error: any) {
        console.error('❌ TEST ERROR:', error.message);
    } finally {
        // Cleanup opcional
        // await knowledgeAssetsCollection.deleteOne({ _id: new ObjectId(docId) });
        // await documentChunksCollection.deleteMany({ sourceDoc: testFilename });
    }
}

testCognitiveRetrievalOptimized().catch(console.error);
