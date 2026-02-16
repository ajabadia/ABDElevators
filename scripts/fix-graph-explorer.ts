
import { config } from 'dotenv';
config({ path: '.env.local' });
import { redis } from '../src/lib/redis';
import { getNeo4jDriver } from '../src/lib/neo4j';

async function main() {
    console.log('🔄 Starting Graph Explorer Fix...');

    // 1. Flush i18n Cache
    console.log('🧹 Flushing i18n cache...');
    try {
        const keys = await redis.keys('i18n:*');
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`✅ Deleted ${keys.length} i18n cache keys.`);
        } else {
            console.log('ℹ️ No i18n cache keys found.');
        }
    } catch (error) {
        console.error('❌ Failed to flush Redis:', error);
    }

    // 2. Test Neo4j Connection
    console.log('🔌 Testing Neo4j connection...');
    try {
        const driver = await getNeo4jDriver();
        const serverInfo = await driver.getServerInfo();
        console.log(`✅ Neo4j Connected: ${serverInfo.address} (${serverInfo.agent})`);

        const session = driver.session();
        try {
            const result = await session.run('RETURN 1 as val');
            console.log('✅ Cypher Query Test: Success', result.records[0].get('val').toInt());
        } finally {
            await session.close();
        }
    } catch (error) {
        console.error('❌ Neo4j Connection Failed:', error);
    }

    console.log('🏁 Fix script completed.');
    process.exit(0);
}

main();
