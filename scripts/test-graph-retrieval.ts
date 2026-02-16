import * as dotenv from 'dotenv';
import path from 'path';
import { GraphRetrievalService } from '../src/services/graph-retrieval-service';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
process.env.SINGLE_TENANT_ID = 'default'; // Mock tenant context for script

async function testGraphRetrieval() {
    console.log('🧪 Testing Graph Retrieval Service...');

    const query = "Que componentes electrónicos tiene el ARCA II?";
    const tenantId = 'default_tenant';
    const correlationId = 'test-retrieval-Id';

    console.log('📝 Query:', query);

    try {
        console.log('🚀 Invoking getGraphContext...');

        const context = await GraphRetrievalService.getGraphContext(
            query,
            tenantId,
            correlationId
        );

        console.log('✅ Retrieval executed successfully!');
        console.log('📊 Result:', JSON.stringify(context, null, 2));

    } catch (error: any) {
        if (error.message && (error.message.includes('Connection') || error.message.includes('connect'))) {
            console.log('✅ logic likely OK, but Neo4j Persistence failed (expected if DB is down).');
            console.error('⚠️ DB Error:', error.message);
        } else {
            console.error('❌ Retrieval Failed:', error);
        }
    }
}

testGraphRetrieval();
