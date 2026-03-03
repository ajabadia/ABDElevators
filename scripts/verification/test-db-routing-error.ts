import { connectDB } from '@/lib/db';

async function badRoutingExample() {
    const db = await connectDB();

    // ❌ ERROR: 'users' should be in AUTH, not MAIN
    const users = await db.collection('users').find({}).toArray();

    // ❌ ERROR: 'tenant_configs' should be in AUTH, not MAIN
    const configs = await db.collection('tenant_configs').findOne({ tenantId: '123' });

    console.log(users, configs);
}
