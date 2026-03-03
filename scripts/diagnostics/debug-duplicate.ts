import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function findDuplicate() {
    try {
        const db = await connectDB();
        const results = await db.collection('knowledge_assets').find({
            fileMd5: "a9ffd0f06ca0011b16048a7e4857eda6",
            tenantId: "global",
            environment: "PRODUCTION"
        }).toArray();

        console.log(`--- FOUND ${results.length} MATCHES ---`);
        console.log(JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

findDuplicate();
