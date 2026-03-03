import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugBlob() {
    try {
        const db = await connectDB();
        const blobs = db.collection('file_blobs');
        const md5 = 'a9ffd0f06ca0011b16048a7e4857eda6';

        const blob = await blobs.findOne({ _id: md5 as any });

        console.log('--- BLOB DETAILS ---');
        console.log(JSON.stringify(blob, null, 2));

    } catch (e) {
        console.error('Error debugging blob:', e);
    } finally {
        process.exit(0);
    }
}

debugBlob();
