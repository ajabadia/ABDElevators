import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkBlobs() {
    try {
        const db = await connectDB();
        const blobs = await db.collection('file_blobs').find().limit(5).toArray();
        console.log('--- SAMPLE BLOBS ---');
        blobs.forEach(b => console.log(`ID: ${b._id} (Type: ${typeof b._id})`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkBlobs();
