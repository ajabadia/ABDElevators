import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
const fs = require('fs');

dotenv.config({ path: '.env.local' });

async function dumpBlobs() {
    try {
        const db = await connectDB();
        const collection = db.collection('file_blobs');
        const count = await collection.countDocuments();
        console.log(`Blobs count: ${count}`);

        const blobs = await collection.find({}).limit(20).toArray();
        console.log(JSON.stringify(blobs, null, 2));

        if (count === 0) {
            console.log('Collection is EMPTY.');
        }

    } catch (e: any) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
dumpBlobs();
