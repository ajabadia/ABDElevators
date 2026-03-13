
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnoseVisibilityDetailed() {
    const uris = {
        MAIN: process.env.MONGODB_URI,
        AUTH: process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI,
    };

    console.log('SINGLE_TENANT_ID:', process.env.SINGLE_TENANT_ID);

    for (const [name, uri] of Object.entries(uris)) {
        if (!uri) continue;
        const client = new MongoClient(uri);
        try {
            await client.connect();
            console.log(`\n--- Cluster ${name} ---`);
            const dbList = await client.db().admin().listDatabases();
            
            for (const dbInfo of dbList.databases) {
                if (dbInfo.name.startsWith('admin') || dbInfo.name.startsWith('local') || dbInfo.name.startsWith('config')) continue;
                
                const db = client.db(dbInfo.name);
                
                // Get knowledge_assets
                const kaCol = db.collection('knowledge_assets');
                const kaDocs = await kaCol.find({}).toArray();
                if (kaDocs.length > 0) {
                    console.log(`[${dbInfo.name}.knowledge_assets] Documents: ${kaDocs.length}`);
                    kaDocs.forEach(d => {
                        console.log(`  - ID: ${d._id}, fileName: ${d.fileName || d.filename}, tenantId: ${d.tenantId}, status: ${d.status}`);
                    });
                }

                // Get user_documents
                const udCol = db.collection('user_documents');
                const udDocs = await udCol.find({}).toArray();
                if (udDocs.length > 0) {
                    console.log(`[${dbInfo.name}.user_documents] Documents: ${udDocs.length}`);
                    udDocs.forEach(d => {
                        console.log(`  - ID: ${d._id}, originalName: ${d.originalName}, tenantId: ${d.tenantId}, userId: ${d.userId}, status: ${d.status}`);
                    });
                }
                
                // Get users to check my own ID
                const usersCol = db.collection('users');
                const me = await usersCol.findOne({ email: /ajabadia/i });
                if (me) {
                    console.log(`[${dbInfo.name}.users] Found ME: ${me.email}, ID: ${me._id}, tenantId: ${me.tenantId}`);
                }
            }
        } catch (e) {
            console.error(`Error in ${name}:`, e);
        } finally {
            await client.close();
        }
    }
}

diagnoseVisibilityDetailed();
