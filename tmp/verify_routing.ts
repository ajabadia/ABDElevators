
import { getTenantCollection } from '../packages/platform-core/src/server/db-tenant';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyRouting() {
    console.log('🧪 Verifying Era 12 Multi-Cluster Routing...');

    const systemSession = {
        user: {
            id: 'system',
            tenantId: 'platform_master',
            role: 'SUPER_ADMIN'
        }
    };

    const tests = [
        { name: 'api_keys', expectedDb: 'ABDElevators-Auth' },
        { name: 'workflow_definitions', expectedDb: 'ABDElevators-Config' },
        { name: 'ai_workflows', expectedDb: 'ABDElevators-Config' },
        { name: 'workflow_analytics', expectedDb: 'ABDElevators-Logs' },
        { name: 'rag_evaluations', expectedDb: 'ABDElevators-Logs' },
        { name: 'orders', expectedDb: 'ABDElevators' }
    ];

    let allOk = true;
    for (const test of tests) {
        try {
            const secureCol = await getTenantCollection(test.name, systemSession as any);
            const rawCol = secureCol.unsecureRawCollection as any;
            const actualDb = rawCol.dbName || (rawCol.s ? rawCol.s.dbName : undefined) || (rawCol.db ? rawCol.db.databaseName : undefined);
            
            if (actualDb === test.expectedDb) {
                console.log(`✅ [${test.name}] -> ${actualDb}`);
            } else {
                console.error(`❌ [${test.name}] -> FAIL: Expected ${test.expectedDb}, got ${actualDb}`);
                allOk = false;
            }
        } catch (e) {
            console.error(`❌ [${test.name}] -> ERROR:`, e.message);
            allOk = false;
        }
    }
    
    if (!allOk) process.exit(1);
}

verifyRouting().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
