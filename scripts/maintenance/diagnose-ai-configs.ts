
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnoseAiConfigs() {
    console.log('SINGLE_TENANT_ID:', process.env.SINGLE_TENANT_ID);
    const uri = process.env.MONGODB_CONFIG_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error('Neither MONGODB_CONFIG_URI nor MONGODB_URI found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Connected to MongoDB (CONFIG Cluster)');
        const db = client.db('ABDElevators-Config');
        const collection = db.collection('ai_configs');
        
        const configs = await collection.find({}).toArray();
        console.log(`Found ${configs.length} AI configs`);
        
        configs.forEach(cfg => {
            console.log(`Config: ID=${cfg._id}, tenantId="${cfg.tenantId}" (${typeof cfg.tenantId})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

diagnoseAiConfigs();
