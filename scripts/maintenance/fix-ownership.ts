
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fixOwnership() {
    const uris = {
        MAIN: process.env.MONGODB_URI,
        AUTH: process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI,
    };

    const targetTenantId = process.env.SINGLE_TENANT_ID || 'demo-tenant';
    
    for (const [name, uri] of Object.entries(uris)) {
        if (!uri) continue;
        const client = new MongoClient(uri);
        try {
            await client.connect();
            console.log(`\n--- Cluster ${name} ---`);
            
            // Find current user ID
            const authDb = client.db('ABDElevators-Auth');
            const me = await authDb.collection('users').findOne({ email: /ajabadia/i });
            if (!me) {
                console.log('User ajabadia not found in Auth DB');
                continue;
            }
            const myId = me._id.toString();
            console.log(`My ID: ${myId}, email: ${me.email}`);

            const mainDb = client.db('ABDElevators');
            
            // 1. Move everything from knowledge_assets to user_documents if it doesn't exist?
            // Actually, let's just make sure all knowledge_assets have a valid ownerId and tenantId
            const kaCol = mainDb.collection('knowledge_assets');
            const kaResult = await kaCol.updateMany(
                { },
                { $set: { tenantId: targetTenantId, ownerId: myId, userId: myId } }
            );
            console.log(`Updated ${kaResult.modifiedCount} documents in knowledge_assets`);

            // 2. Fix user_documents (if any)
            const udCol = mainDb.collection('user_documents');
            const udResult = await udCol.updateMany(
                { },
                { $set: { tenantId: targetTenantId, userId: myId, ownerId: myId } }
            );
            console.log(`Updated ${udResult.modifiedCount} documents in user_documents`);

        } catch (e) {
            console.error(`Error in ${name}:`, e);
        } finally {
            await client.close();
        }
    }
}

fixOwnership();
