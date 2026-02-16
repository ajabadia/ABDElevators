import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { GraphMutationService } from '../src/services/graph/GraphMutationService';
import { runQuery, closeNeo4j } from '../src/lib/neo4j';

async function verifyMutations() {
    const tenantId = 'test-tenant-mutations';
    console.log(`🚀 Starting Graph Mutation Verification for tenant: ${tenantId}`);

    try {
        // 1. Clean previous test data
        console.log('🧹 Cleaning test data...');
        await runQuery(`MATCH (n { tenantId: $tenantId }) DETACH DELETE n`, { tenantId });

        // 2. Create Node A
        console.log('📝 Creating Node A...');
        const nodeAId = await GraphMutationService.createNode({
            label: 'TestNode',
            name: 'Node A',
            properties: { category: 'Testing', value: 100 }
        }, tenantId);
        console.log(`✅ Node A created: ${nodeAId}`);

        // 3. Create Node B
        console.log('📝 Creating Node B...');
        const nodeBId = await GraphMutationService.createNode({
            label: 'TestNode',
            name: 'Node B',
            properties: { category: 'Testing', value: 200 }
        }, tenantId);
        console.log(`✅ Node B created: ${nodeBId}`);

        // 4. Update Node A
        console.log('📝 Updating Node A...');
        await GraphMutationService.updateNode({
            id: nodeAId,
            properties: { value: 150, updated: true }
        }, tenantId);
        console.log('✅ Node A updated');

        // 5. Create Relation
        console.log('📝 Creating Relation A -> B...');
        await GraphMutationService.createRelation({
            sourceId: nodeAId,
            targetId: nodeBId,
            type: 'TEST_REL',
            properties: { weight: 0.9, notes: 'Direct connection' }
        }, tenantId);
        console.log('✅ Relation created');

        // 6. Update Relation
        console.log('📝 Updating Relation A -> B...');
        await GraphMutationService.updateRelation({
            sourceId: nodeAId,
            targetId: nodeBId,
            type: 'TEST_REL',
            properties: { weight: 1.0 }
        }, tenantId);
        console.log('✅ Relation updated');

        // 7. Verification Query
        console.log('🔍 Verifying state in Neo4j...');
        const result = await runQuery(
            `MATCH (n { id: $nodeAId, tenantId: $tenantId })-[r:TEST_REL]->(m { id: $nodeBId, tenantId: $tenantId })
             RETURN n, r, m`,
            { nodeAId, nodeBId, tenantId }
        );

        if (result.records.length === 1) {
            const rel = result.records[0].get('r');
            console.log(`🏆 SUCCESS: Relationship found with weight ${rel.properties.weight}`);
        } else {
            throw new Error('Verification failed: Relationship not found');
        }

        // 8. Delete Relation
        console.log('🗑️ Deleting relation...');
        await GraphMutationService.deleteRelation({
            sourceId: nodeAId,
            targetId: nodeBId,
            type: 'TEST_REL'
        }, tenantId);
        console.log('✅ Relation deleted');

        // 9. Delete Node
        console.log('🗑️ Deleting Node A...');
        await GraphMutationService.deleteNode(nodeAId, tenantId);
        console.log('✅ Node A deleted');

        console.log('🎉 Verification completed successfully!');

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await closeNeo4j();
    }
}

verifyMutations();
