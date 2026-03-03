import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Trying a slightly modified connection string
const uri = "mongodb+srv://abadia3d_db_user:Ajabafan1974@pruebas.nwakk9f.mongodb.net/ABDElevators?authSource=admin&appName=pruebas";

async function test() {
    console.log('Testing connection with manual URI...');
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('✅ Connected with manual URI!');
        await client.close();
    } catch (err: any) {
        console.error('❌ Failed:', err.message);
    }
}
test();
