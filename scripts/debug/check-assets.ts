import * as dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../../src/lib/db';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function checkAssets() {
    console.log('🔍 Buscando activos recientes...');
    try {
        const db = await connectDB();
        const assets = await db.collection('knowledge_assets')
            .find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        if (assets.length === 0) {
            console.log('✅ No hay activos en la colección.');
        } else {
            console.log(`📋 Se encontraron ${assets.length} activos:`);
            assets.forEach((asset, i) => {
                console.log(`[${i + 1}] ID: ${asset._id} | Tenant: ${asset.tenantId} | Status: ${asset.ingestionStatus} | Created: ${asset.createdAt}`);
                console.log(`    Filename: ${asset.source?.filename || 'N/A'}`);
                if (asset.correlationId) console.log(`    CorrelationId: ${asset.correlationId}`);
            });
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAssets();
