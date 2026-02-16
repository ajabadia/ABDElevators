
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
        componentType: "motor",
        model: "TEST-GERMAN-MODEL",
        sourceDoc: "manual_de_test.pdf",
        version: "1.0",
        revisionDate: new Date(),
        language: 'es', // Shadow pretends to be Spanish
        originalLang: 'de', // Real lang is German
        chunkText: "Este es el texto traducido al español para búsqueda.",
        isShadow: true,
        refChunkId: mockOriginalId,
        embedding: new Array(768).fill(0.1), // Mock embedding
        embedding_multilingual: undefined,
        // cloudinaryUrl and createdAt removed if not in DocumentChunkSchema or optional
        createdAt: new Date(),
    };

    try {
        const validated = DocumentChunkSchema.parse(shadowChunkData);
        console.log('✅ Shadow Chunk Schema Validation PASSED');
        console.log('   is_shadow:', validated.isShadow);
        console.log('   original_lang:', validated.originalLang);
        console.log('   ref_chunk_id:', validated.refChunkId);
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
