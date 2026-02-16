import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugState() {
    try {
        const db = await connectDB();
        const md5 = 'a9ffd0f06ca0011b16048a7e4857eda6';

        console.log('Searching for MD5:', md5);

        const assets = await db.collection('knowledge_assets').find({
            $or: [
                { fileMd5: md5 },
                { filename: /Real Decreto/i }
            ]
        }).toArray();

        const blobs = await db.collection('file_blobs').find({
            _id: md5 as any
        }).toArray();

        console.log('--- ASSETS FOUND ---');
        console.log(JSON.stringify(assets, null, 2));

        console.log('--- BLOBS FOUND ---');
        console.log(JSON.stringify(blobs, null, 2));

    } catch (e) {
        console.error('Error debugging state:', e);
    } finally {
        process.exit(0);
    }
}

debugState();
