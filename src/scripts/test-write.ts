
import { connectDB, getMongoClient } from '../lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testWrite() {
    console.log('📝 Testing write to workflow_definitions...');

    try {
        const db = await connectDB();
        console.log(`Connected to: ${db.databaseName}`);

        const collection = db.collection('workflow_definitions');
        const result = await collection.insertOne({
            name: 'Test Connectivity Flow',
            tenantId: 'test_tenant',
            createdAt: new Date()
        });
        console.log(`Successfully inserted test doc with ID: ${result.insertedId}`);

        const allCollections = await db.listCollections().toArray();
        console.log(`Current Collections: ${allCollections.map(c => c.name).join(', ')}`);

    } catch (error) {
        console.error('❌ Error testing write:', error);
    } finally {
        const client = await getMongoClient();
        if (client) await client.close();
    }
}

testWrite();
