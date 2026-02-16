import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    try {
        console.log('Testing connection...');
        const db = await connectDB();
        console.log('Connected to:', db.databaseName);
        const col = db.collection('knowledge_assets');
        const count = await col.countDocuments();
        console.log('Assets count:', count);
    } catch (e: any) {
        console.error('Connection failed:', e.message);
    } finally {
        process.exit(0);
    }
}
test();
