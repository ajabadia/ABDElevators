import * as dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../lib/db';
import { getTenantCollection } from '../lib/db-tenant';
import { ObjectId } from 'mongodb';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function rawVerify() {
    console.log('🏁 RAW VERIFICATION START');
    const tenantId = process.env.SINGLE_TENANT_ID || 'tenant_test_123';

    try {
        const db = await connectDB();
        console.log(`✅ Connected to DB: ${db.databaseName}`);

        const session = { user: { tenantId, role: 'SUPER_ADMIN' } };
        const tasksColl = await getTenantCollection('workflow_tasks', session);
        console.log('✅ Collection accessible');

        await tasksColl.insertOne({
            tenantId,
            title: 'Raw Test',
            status: 'PENDING',
            createdAt: new Date()
        } as any);
        console.log('✅ Task inserted');

        console.log('✨ RAW VERIFICATION SUCCESSFUL');
    } catch (e: any) {
        console.error('❌ RAW VERIFICATION FAILED');
        console.error(JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

rawVerify();
