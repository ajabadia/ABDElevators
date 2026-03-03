import { connectDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function searchAll() {
    try {
        const db = await connectDB();
        const collections = await db.listCollections().toArray();

        for (const colInfo of collections) {
            const col = db.collection(colInfo.name);
            const docs = await col.find({
                $or: [
                    { model: { $regex: /gemini-1\.5/i } },
                    { defaultModel: { $regex: /gemini-1\.5/i } },
                    { fallbackModel: { $regex: /gemini-1\.5/i } }
                ]
            }).toArray();

            if (docs.length > 0) {
                console.log(`⚠️ Found ${docs.length} matches in collection: ${colInfo.name}`);
                docs.forEach(d => console.log(`   - ID: ${d._id}, key: ${d.key || 'N/A'}, tenantId: ${d.tenantId || 'N/A'}`));
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error searching DB:', error);
        process.exit(1);
    }
}

searchAll();
