
import { connectDB } from "../src/lib/db";
import { DocumentChunkSchema } from "../src/lib/schemas";
import { ObjectId } from "mongodb";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyDualIndex() {
    console.log('--- Verifying Dual-Indexing Logic ---');

    // Simulate data that would come from the Ingest API
    const tenantId = "test_dual_index_tenant";
    const runId = new Date().toISOString();

    // We are simulating that the ingest process has run.
    // Instead of calling the API (which requires file upload simulation),
    // we will check the schema validation manually here to ensure our 
    // "Shadow Chunk" structure is valid according to our Zod schema.

    console.log('1. Validating Shadow Chunk Schema...');

    const mockOriginalId = new ObjectId();

    const shadowChunkData = {
        _id: new ObjectId(),
        tenantId,
        industry: "ELEVATORS",
        tipo_componente: "motor",
        modelo: "TEST-GERMAN-MODEL",
        origen_doc: "manual_de_test.pdf",
        version_doc: "1.0",
        fecha_revision: new Date(),
        language: 'es', // Shadow pretends to be Spanish
        original_lang: 'de', // Real lang is German
        texto_chunk: "Este es el texto traducido al español para búsqueda.",
        is_shadow: true,
        ref_chunk_id: mockOriginalId,
        embedding: new Array(768).fill(0.1), // Mock embedding
        embedding_multilingual: undefined,
        cloudinary_url: "http://example.com/file.pdf",
        cloudinary_public_id: "file_123",
        creado: new Date(),
    };

    try {
        const validated = DocumentChunkSchema.parse(shadowChunkData);
        console.log('✅ Shadow Chunk Schema Validation PASSED');
        console.log('   is_shadow:', validated.is_shadow);
        console.log('   original_lang:', validated.original_lang);
        console.log('   ref_chunk_id:', validated.ref_chunk_id);
    } catch (error) {
        console.error('❌ Shadow Chunk Schema Validation FAILED:', error);
        process.exit(1);
    }

    console.log('\n2. Checking DB Indexes for Dual Search...');
    const db = await connectDB();
    const chunksCol = db.collection('document_chunks');
    const indexes = await chunksCol.indexes();

    const embeddingIndex = indexes.find(idx => (idx.name && idx.name.includes("vector")) || (idx.key && idx.key.embedding));

    if (embeddingIndex) {
        console.log('✅ Vector Index found on "embedding" field.');
        console.log('   This confirms that searching against "embedding" will hit both Original and Shadow chunks.');
    } else {
        console.warn('⚠️  No specific vector index found on "embedding". Ensure Atlas Search is configured.');
    }

    // Optional: Clean up any test data if we were inserting
    // await chunksCol.deleteMany({ tenantId });

    console.log('\n--- Verification Complete ---');
    process.exit(0);
}

verifyDualIndex();
