
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function compareOrgs() {
    const configUri = process.env.MONGODB_CONFIG_URI;
    const authUri = process.env.MONGODB_AUTH_URI;
    
    const configClient = new MongoClient(configUri!);
    const authClient = new MongoClient(authUri!);
    
    await configClient.connect();
    await authClient.connect();
    
    const configOrgs = await configClient.db('ABDElevators-Config').collection('organizations').find().toArray();
    const authOrgs = await authClient.db('ABDElevators-Auth').collection('organizations').find().toArray();
    
    console.log('--- CONFIG ORGS (5) ---');
    console.log(JSON.stringify(configOrgs.map(o => ({ id: o._id, name: o.name, slug: o.slug })), null, 2));
    
    console.log('--- AUTH ORGS (2) ---');
    console.log(JSON.stringify(authOrgs.map(o => ({ id: o._id, name: o.name, slug: o.slug })), null, 2));
    
    await configClient.close();
    await authClient.close();
}

compareOrgs().catch(console.error);
