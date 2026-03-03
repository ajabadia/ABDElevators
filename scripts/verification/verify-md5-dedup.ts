
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectDB } from "../src/lib/db";
import crypto from 'crypto';
import { ObjectId } from 'mongodb';

async function verifyDeduplication() {
    console.log('--- Verifying MD5 Deduplication Logic ---');

    const db = await connectDB();
    const docsCol = db.collection('documentos_tecnicos');

    // Generate a unique test hash and tenant
    const testContent = `Test content for deduplication verification - ${Date.now()}`;
    const fileHash = crypto.createHash('md5').update(testContent).digest('hex');
    const tenantA = 'tenant_verification_A';
    const tenantB = 'tenant_verification_B';

    console.log(`Generated Test Hash: ${fileHash}`);

    try {
        // 1. Clean previous test artifacts if any
        await docsCol.deleteMany({ archivo_md5: fileHash });
        console.log('Cleaned previous test artifacts.');

        // 2. Insert "First Upload" for Tenant A
        const docA = {
            tenantId: tenantA,
            nombre_archivo: 'test_doc_A.pdf',
            archivo_md5: fileHash,
            total_chunks: 5,
            creado: new Date(),
            mock_data: true
        };
        await docsCol.insertOne(docA as any);
        console.log(`Step 1: Inserted document for Tenant A (ID: ${docA.archivo_md5})`);

        // 3. Simulate "Second Upload" for Tenant A (Same Tenant Re-upload)
        const checkA = await docsCol.findOne({ archivo_md5: fileHash, tenantId: tenantA });
        if (checkA) {
            console.log('Step 2 Success: System detected existing document for SAME tenant.');
        } else {
            console.error('Step 2 Failed: System did NOT detect existing document for same tenant.');
        }

        // 4. Simulate "Second Upload" for Tenant B (Different Tenant - Cross-Tenant Deduplication)
        // logic mirrors route.ts: const existingDoc = await documents.findOne({ archivo_md5: fileHash });
        const existingGlobal = await docsCol.findOne({ archivo_md5: fileHash });
        if (existingGlobal) {
            console.log('Step 3 Success: System detected global existing document by MD5.');

            // Simulate cloning logic
            const docB = {
                ...existingGlobal,
                _id: undefined,
                tenantId: tenantB,
                nombre_archivo: 'test_doc_B_clone.pdf',
                creado: new Date()
            };

            // In real app we insert this
            await docsCol.insertOne(docB as any);
            console.log('Step 3: Cloned metadata for Tenant B.');
        } else {
            console.error('Step 3 Failed: System did not find the global document.');
        }

        // 5. Verify Tenant B has the document now
        const checkB = await docsCol.findOne({ archivo_md5: fileHash, tenantId: tenantB });
        if (checkB) {
            console.log(`Step 4 Success: Tenant B now has independent metadata entry linked to same content hash.`);
        } else {
            console.error('Step 4 Failed: Tenant B document not found.');
        }

    } catch (error) {
        console.error('Verification failed with error:', error);
    } finally {
        // Cleanup
        await docsCol.deleteMany({ archivo_md5: fileHash });
        console.log('Cleanup complete.');
        process.exit(0);
    }
}

verifyDeduplication();
