
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fixTenantIds() {
    const uris = {
        MAIN: process.env.MONGODB_URI,
    };

    const targetTenantId = process.env.SINGLE_TENANT_ID || 'demo-tenant';
    console.log('Target Tenant ID:', targetTenantId);

    for (const [name, uri] of Object.entries(uris)) {
        if (!uri) continue;
        const client = new MongoClient(uri);
        try {
            await client.connect();
            console.log(`\n--- Cluster ${name} ---`);
            const db = client.db('ABDElevators');
            
            // Fix knowledge_assets
            const kaCol = db.collection('knowledge_assets');
            const kaResult = await kaCol.updateMany(
                { tenantId: { $ne: targetTenantId } },
                { $set: { tenantId: targetTenantId } }
            );
            console.log(`Updated ${kaResult.modifiedCount} documents in knowledge_assets`);

            // Fix user_documents
            const udCol = db.collection('user_documents');
            const udResult = await udCol.updateMany(
                { tenantId: { $ne: targetTenantId } },
                { $set: { tenantId: targetTenantId } }
            );
            console.log(`Updated ${udResult.modifiedCount} documents in user_documents`);

            // Check if we have documents now
            const totalKA = await kaCol.countDocuments({ tenantId: targetTenantId });
            const totalUD = await udCol.countDocuments({ tenantId: targetTenantId });
            console.log(`Total visible knowledge_assets: ${totalKA}`);
            console.log(`Total visible user_documents: ${totalUD}`);

        } catch (e) {
            console.error(`Error in ${name}:`, e);
        } finally {
            await client.close();
        }
    }
}

fixTenantIds();
