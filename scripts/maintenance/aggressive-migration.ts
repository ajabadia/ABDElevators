
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function aggressiveMigration() {
    const uris = [
        process.env.MONGODB_URI,
        process.env.MONGODB_AUTH_URI,
        process.env.MONGODB_CONFIG_URI
    ].filter(Boolean) as string[];

    const targetTenantId = process.env.SINGLE_TENANT_ID || 'demo-tenant';
    
    // Use a unique set of URIs
    const uniqueUris = Array.from(new Set(uris));

    for (const uri of uniqueUris) {
        const client = new MongoClient(uri);
        try {
            await client.connect();
            console.log(`\n--- Connected to ${uri.split('@')[1] || 'local'} ---`);
            
            const dbList = await client.db().admin().listDatabases();
            for (const dbInfo of dbList.databases) {
                if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
                
                const db = client.db(dbInfo.name);
                console.log(`Checking DB: ${dbInfo.name}`);

                // Find user
                const user = await db.collection('users').findOne({ email: /ajabadia/i });
                const myId = user?._id.toString();
                if (myId) {
                    console.log(`  Found User ID: ${myId}`);
                }

                const collections = ['knowledge_assets', 'user_documents'];
                for (const colName of collections) {
                    const col = db.collection(colName);
                    const count = await col.countDocuments();
                    if (count > 0) {
                        const update: any = { $set: { tenantId: targetTenantId } };
                        if (myId) {
                            update.$set.userId = myId;
                            update.$set.ownerId = myId;
                        }
                        
                        const result = await col.updateMany({}, update);
                        console.log(`  Updated ${result.modifiedCount}/${count} in ${colName} (tenantId=${targetTenantId}${myId ? ', userId=' + myId : ''})`);
                    }
                }
            }
        } catch (e) {
            console.error(`Error in ${uri}:`, e);
        } finally {
            await client.close();
        }
    }
}

aggressiveMigration();
