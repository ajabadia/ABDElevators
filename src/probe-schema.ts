
import { DocumentChunkSchema } from './lib/schemas';
import { z } from 'zod';

async function main() {
    console.log('--- PROBING DocumentChunkSchema ---');
    const dummy: any = {
        tenantId: '000000000000000000000000',
        industry: 'ELEVATORS',
        sourceDoc: 'test.pdf',
        assetId: '000000000000000000000000',
        chunkText: 'Hello world',
        chunkType: 'TEXT',
        language: 'es',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    try {
        console.log('Attempting to parse without embeddings...');
        DocumentChunkSchema.parse(dummy);
        console.log('✅ Success! Embeddings are NOT required.');
    } catch (e: any) {
        console.log('❌ Failed! Errors:');
        if (e instanceof z.ZodError) {
            e.issues.forEach(i => console.log(`   - ${i.path.join('.')}: ${i.message}`));
        } else {
            console.log(e);
        }
    }

    try {
        console.log('\nAttempting to parse with null embeddings...');
        DocumentChunkSchema.parse({ ...dummy, embedding: null, embedding_multilingual: null });
        console.log('✅ Success! Null embeddings are allowed.');
    } catch (e: any) {
        console.log('❌ Failed! Errors:');
        if (e instanceof z.ZodError) {
            e.issues.forEach(i => console.log(`   - ${i.path.join('.')}: ${i.message}`));
        } else {
            console.log(e);
        }
    }

    process.exit(0);
}

main();
