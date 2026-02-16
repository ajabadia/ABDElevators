
import { connectDB, getMongoClient } from '../lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnoseWorkflows() {
    console.log('🕵️ Deep Diagnosis of Workflows...');

    try {
        const db = await connectDB();
        console.log(`📡 Connected to database: ${db.databaseName}`);

        const allCollections = await db.listCollections().toArray();
        console.log(`📚 Collections in DB: ${allCollections.map(c => c.name).join(', ')}`);

        const collectionName = allCollections.find(c => c.name === 'workflow_definitions') ? 'workflow_definitions' : 'workflows';
        console.log(`Using collection: ${collectionName}`);

        const collection = db.collection(collectionName);

        const tenantId = process.env.SINGLE_TENANT_ID || 'default_tenant';
        console.log(`Target Tenant: ${tenantId}`);

        const allDocs = await collection.find({}).toArray();
        console.log(`Total Documents in collection: ${allDocs.length}`);

        if (allDocs.length > 0) {
            console.log('\n--- Breakdown ---');
            const counts = {
                correctTenant: allDocs.filter(d => d.tenantId === tenantId).length,
                entityTypeEntity: allDocs.filter(d => d.entityType === 'ENTITY').length,
                envProduction: allDocs.filter(d => d.environment === 'PRODUCTION').length,
                activeTrue: allDocs.filter(d => d.active === true).length,
                notDeleted: allDocs.filter(d => !d.deletedAt).length,
            };
            console.log(JSON.stringify(counts, null, 2));

            console.log('\n--- Sample 1 detailed ---');
            console.log(JSON.stringify(allDocs[0], null, 2));

            const visibleDocs = allDocs.filter(d =>
                d.tenantId === tenantId &&
                d.entityType === 'ENTITY' &&
                d.environment === 'PRODUCTION' &&
                !d.deletedAt
            );
            console.log(`\nVisible Documents according to filter: ${visibleDocs.length}`);
        }

    } catch (error) {
        console.error('❌ Error during diagnosis:', error);
    } finally {
        const client = await getMongoClient();
        if (client) await client.close();
        console.log('\n🔌 Connection closed.');
    }
}

diagnoseWorkflows();
