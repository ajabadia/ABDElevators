import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkIds() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const dbAuth = client.db('ABDElevators-Auth');
        const user = await dbAuth.collection('usuarios').findOne({});
        console.log('USER TENANT ID:', JSON.stringify(user?.tenantId));

        const dbMain = client.db('ABDElevators');
        const prompt = await dbMain.collection('prompts').findOne({ key: 'LANGUAGE_DETECTOR' });
        console.log('PROMPT TENANT ID:', JSON.stringify(prompt?.tenantId));

        console.log('ENV SINGLE_TENANT_ID:', JSON.stringify(process.env.SINGLE_TENANT_ID));
    } finally {
        await client.close();
    }
}

checkIds();
