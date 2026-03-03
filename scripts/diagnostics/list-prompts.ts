
import { connectDB } from '../lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listPrompts() {
    console.log('📜 Listing prompts collection names...');

    try {
        const db = await connectDB();
        const collection = db.collection('prompts');
        const items = await collection.find({}, { projection: { name: 1, key: 1, type: 1 } }).toArray();

        items.forEach(item => {
            console.log(`- ${item.name || 'NO NAME'} (Key: ${item.key || 'NO KEY'})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

listPrompts();
