import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;

async function test() {
    if (!uri) {
        console.error('MONGODB_URI missing');
        process.exit(1);
    }
    console.log('Testing connection with tlsAllowInvalidCertificates...');
    const client = new MongoClient(uri, {
        tls: true,
        tlsAllowInvalidCertificates: true,
        connectTimeoutMS: 5000
    });
    try {
        await client.connect();
        console.log('✅ Connected!');
        await client.close();
    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        if (err.stack) console.error(err.stack);
    }
}
test();
