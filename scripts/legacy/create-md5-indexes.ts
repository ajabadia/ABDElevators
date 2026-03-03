
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectDB } from "../src/lib/db";

async function createIndexes() {
    console.log('--- Creating Indexes for MD5 Deduplication ---');
    try {
        const db = await connectDB();

        // 1. Documentos Tecnicos
        // We want faster lookups by hash
        // Note: unique: false because multiple tenants can share the same hash (that's the point of cloning metadata)
        // But (hash + tenantId) should ideally be unique to avoid double listing for same tenant, 
        // though our logic handles it by checking before insert.
        // Let's at least index the hash field for performance.

        const docsCol = db.collection('documentos_tecnicos');
        const hashResult = await docsCol.createIndex({ fileMd5: 1 }, { background: true });
        console.log(`Created index on documentos_tecnicos.fileMd5: ${hashResult}`);

        // Composite index for tenant lookups
        const tenantHashResult = await docsCol.createIndex({ tenantId: 1, fileMd5: 1 }, { background: true });
        console.log(`Created composite index on documentos_tecnicos.tenantId + fileMd5: ${tenantHashResult}`);


        // 2. Pedidos
        const pedidosCol = db.collection('pedidos');
        const pedHashResult = await pedidosCol.createIndex({ fileMd5: 1 }, { background: true });
        console.log(`Created index on pedidos.fileMd5: ${pedHashResult}`);

        const pedTenantHashResult = await pedidosCol.createIndex({ tenantId: 1, fileMd5: 1 }, { background: true });
        console.log(`Created composite index on pedidos.tenantId + fileMd5: ${pedTenantHashResult}`);

        console.log('All indexes created successfully.');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
    process.exit(0);
}

createIndexes();
