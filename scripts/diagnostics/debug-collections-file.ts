import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listCollections() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        fs.writeFileSync('debug_collections_output.txt', 'MONGODB_URI no encontrada');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const collections = await db.listCollections().toArray();

        let output = '--- Colecciones en ABDElevators ---\n';
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            output += `- ${col.name}: ${count} documentos\n`;
        }
        output += '-----------------------------------\n';
        fs.writeFileSync('debug_collections_output.txt', output);

    } catch (error: any) {
        fs.writeFileSync('debug_collections_output.txt', `Error: ${error.message}`);
    } finally {
        await client.close();
        process.exit(0);
    }
}

listCollections();
