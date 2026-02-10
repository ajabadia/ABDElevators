import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkTenant() {
    try {
        const db = await connectDB();
        const asset = await db.collection('knowledge_assets').find({}).sort({ createdAt: -1 }).limit(1).next();
        if (asset) {
            console.log('FILENAME:', asset.filename);
            console.log('TENANT_ID:', asset.tenantId);
            console.log('SCOPE:', asset.scope);
            console.log('INGESTION_STATUS:', asset.ingestionStatus);
            console.log('CREATED_AT:', asset.createdAt);
        } else {
            console.log('NO ASSETS FOUND');
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkTenant();
