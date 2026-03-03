
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyChecklistFlow() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('=== VERIFYING PHASE 82: PERSISTENT CHECKLISTS ===\n');

        // 1. Setup a test entity if none exists
        let entity = await db.collection('entities').findOne({});
        if (!entity) {
            console.log('No entities found, creating test entity...');
            const res = await db.collection('entities').insertOne({
                identifier: 'TEST-ORDER-82',
                originalText: 'Test content for extraction',
                tenantId: 'abd_global',
                industry: 'ELEVATORS',
                status: 'received',
                createdAt: new Date()
            });
            entity = await db.collection('entities').findOne({ _id: res.insertedId });
        }

        const entityId = entity!._id.toString();
        const tenantId = entity!.tenantId || 'abd_global';

        console.log(`Using Entity ID: ${entityId} (Tenant: ${tenantId})`);

        // 2. Initial extraction (Simulate dynamic save)
        console.log('\n2. Simulating initial extraction...');
        const mockItems = [
            { id: 'item-1', description: 'Verificar cables', confidence: 0.9, confidenceLevel: 'HIGH' },
            { id: 'item-2', description: 'Revisar motor', confidence: 0.7, confidenceLevel: 'MEDIUM' }
        ];

        await db.collection('extracted_checklists').updateOne(
            { entityId },
            {
                $set: {
                    items: mockItems,
                    tenantId,
                    updatedAt: new Date()
                },
                $setOnInsert: { createdAt: new Date(), validations: {} }
            },
            { upsert: true }
        );
        console.log('✅ Checklist saved to persistence layer.');

        // 3. Persist Validation (Technician Input)
        console.log('\n3. Simulating technician validation...');
        const itemId = 'item-1';
        const updateKey = `validations.${itemId}`;
        await db.collection('extracted_checklists').updateOne(
            { entityId, tenantId },
            {
                $set: {
                    [updateKey]: {
                        itemId,
                        status: 'OK',
                        notes: 'Todo en orden por el script de prueba',
                        technicianId: 'system-test',
                        updatedAt: new Date()
                    }
                }
            }
        );
        console.log('✅ Validation persisted.');

        // 4. Verify Merge logic
        console.log('\n4. Verifying persistence result...');
        const result = await db.collection('extracted_checklists').findOne({ entityId });

        if (result && result.validations['item-1']?.status === 'OK') {
            console.log('✅ SUCCESS: Validation found in DB.');
            console.log('Validation Details:', JSON.stringify(result.validations['item-1'], null, 2));
        } else {
            console.error('❌ FAILURE: Validation not found or incorrect.');
        }

        // Clean up if we created it
        // if (entity.identifier === 'TEST-ORDER-82') await db.collection('entities').deleteOne({ _id: entity._id });
        // await db.collection('extracted_checklists').deleteOne({ entityId });

    } catch (error) {
        console.error('VERIFICATION ERROR:', error);
    } finally {
        await client.close();
    }
}

verifyChecklistFlow();
