import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listCollections() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const collections = await db.listCollections().toArray();

        console.log('\n--- Colecciones en ABDElevators ---');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documentos`);
        }
        console.log('-----------------------------------\n');

    } catch (error: any) {
        console.error('Error:', error.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}

listCollections();
