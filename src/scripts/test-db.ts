
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from '../lib/db';
console.log('connectDB imported');

async function test() {
    try {
        const db = await connectDB();
        console.log('✅ Connected to:', db.databaseName);
    } catch (e: any) {
        console.error('❌ Connection failed:', e.message);
        process.exit(1);
    }
    process.exit(0);
}
test();
