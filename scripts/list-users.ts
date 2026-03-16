
import { connectDB, connectAuthDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function listUsers() {
    try {
        console.log('--- Checking MAIN Cluster ---');
        const dbMain = await connectDB();
        const usersMain = await dbMain.collection('users').find({}).project({ email: 1, tenantId: 1, role: 1 }).limit(10).toArray();
        console.log('Users in MAIN:', JSON.stringify(usersMain, null, 2));
    } catch (e) {
        console.error('Error connecting to MAIN:', e);
    }

    try {
        console.log('\n--- Checking AUTH Cluster ---');
        const dbAuth = await connectAuthDB();
        const usersAuth = await dbAuth.collection('users').find({}).project({ email: 1, tenantId: 1, role: 1 }).limit(10).toArray();
        console.log('Users in AUTH:', JSON.stringify(usersAuth, null, 2));
    } catch (e) {
        console.error('Error connecting to AUTH:', e);
    }
    
    process.exit(0);
}

listUsers().catch(err => {
    console.error(err);
    process.exit(1);
});
