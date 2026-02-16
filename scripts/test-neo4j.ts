import { runQuery, closeNeo4j } from '../src/lib/neo4j';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testNeo4jConnection() {
    console.log('🧪 Testing Neo4j Connection...');
    console.log(`📡 URI: ${process.env.NEO4J_URI}`);
    console.log(`👤 User: ${process.env.NEO4J_USERNAME}`);

    try {
        const result = await runQuery('RETURN 1 as test');
        const value = result.records[0].get('test').toNumber();

        if (value === 1) {
            console.log('✅ Neo4j Connection Successful!');
        } else {
            console.error('❌ Neo4j Connection Failed: Unexpected result', value);
            process.exit(1);
        }
    } catch (error: any) {
        console.error('❌ Neo4j Connection Failed:', error.message);
        if (error.code) console.error('Error Code:', error.code);
        process.exit(1);
    } finally {
        await closeNeo4j();
    }
}

testNeo4jConnection();
