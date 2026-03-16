
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        
        console.log('--- KNOWLEDGE ASSETS ---');
        const assets = await db.collection('knowledge_assets').find({}).toArray();
        assets.forEach(a => {
            console.log(`ID: ${a._id}, Status: ${a.ingestionStatus}, File: ${a.source?.filename || a.filename}, Chunks: ${a.totalChunks}`);
            if (a.error) {
                console.log(`   Error: ${JSON.stringify(a.error)}`);
            }
        });

        console.log('\n--- DOCUMENT CHUNKS ---');
        const chunkCount = await db.collection('document_chunks').countDocuments();
        console.log(`Total chunks: ${chunkCount}`);

        process.exit(0);
    } catch (e: any) {
        console.error('Failed to inspect DB!');
        console.error(e);
        process.exit(1);
    } finally {
        await client.close();
    }
}

main();
