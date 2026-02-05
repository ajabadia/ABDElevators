import { IngestService } from '@/services/ingest-service';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';

async function testCognitiveRetrieval() {
    console.log('--- STARTING COGNITIVE RETRIEVAL TEST ---');

    // Simular un activo ya preparado
    const db = await connectDB();
    const knowledgeAssetsCollection = db.collection('knowledge_assets');
    const documentChunksCollection = db.collection('document_chunks');

    const testAsset = {
        tenantId: 'platform_master',
        filename: 'manual_tecnico_test.pdf',
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
        // Ejecutar análisis (el mock descargará el PDF de Cloudinary o fallará si no existe, 
        // pero aquí queremos testear la orquestación)
        // NOTA: Para un test real de CI necesitaríamos mockear el fetch del PDF.
        // Aquí probamos si el servicio se instancia y corre la lógica de contexto.

        console.log('Executing executeAnalysis...');
        // Mocking options
        const result = await IngestService.executeAnalysis(docId, {
            userEmail: 'test@example.com',
            correlationId: 'test-cognitive-' + Date.now()
        });

        console.log('Ingest Result:', result);

        // Verificar chunks
        const chunks = await documentChunksCollection.find({ sourceDoc: testAsset.filename }).toArray();
        console.log(`Found ${chunks.length} chunks.`);

        if (chunks.length > 0) {
            const firstChunk = chunks[0];
            console.log('\n--- FIRST CHUNK PREVIEW ---');
            console.log('Context Header:', firstChunk.contextHeader);
            console.log('Chunk Text (Contextualized):', firstChunk.chunkText.substring(0, 300) + '...');
            console.log('Original Snippet:', (firstChunk.originalSnippet || '').substring(0, 100) + '...');

            if (firstChunk.contextHeader && firstChunk.chunkText.includes('[CONTEXTO:')) {
                console.log('\n✅ SUCCESS: Contextualization verified.');
            } else {
                console.log('\n❌ FAILURE: Contextualization missing.');
            }
        }

    } catch (error: any) {
        console.error('❌ TEST ERROR:', error.message);
    } finally {
        // Cleanup
        // await knowledgeAssetsCollection.deleteOne({ _id: new ObjectId(docId) });
        // await documentChunksCollection.deleteMany({ sourceDoc: testAsset.filename });
    }
}

testCognitiveRetrieval().catch(console.error);
