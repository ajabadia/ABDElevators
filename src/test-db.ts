
import { connectDB } from './lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    console.log('Testing DB connection...');
    console.log('URI:', process.env.MONGODB_URI ? 'Exists' : 'Missing');
    try {
        const db = await connectDB();
        console.log('Connected to:', db.databaseName);
        process.exit(0);
    } catch (e: any) {
        console.error('Connection failed!');
        console.error(e);
        process.exit(1);
    }
}

test();
