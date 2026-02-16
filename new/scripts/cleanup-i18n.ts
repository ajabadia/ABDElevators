import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function cleanup() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const collection = db.collection('i18n_translations');

        // Buscar documentos con valor vacío
        const emptyDocs = await collection.find({ value: "" }).toArray();
        console.log(`Encontrados ${emptyDocs.length} documentos con valor vacío.`);

        if (emptyDocs.length > 0) {
            const result = await collection.deleteMany({ value: "" });
            console.log(`✅ Eliminados ${result.deletedCount} documentos vacíos.`);
        }

        // También buscar documentos que accidentalmente tienen tenantId: undefined o similar
        const weirdDocs = await collection.deleteMany({
            $or: [
                { tenantId: { $exists: false } },
                { tenantId: null },
                { tenantId: "unknown" }
            ]
        });
        console.log(`✅ Eliminados ${weirdDocs.deletedCount} documentos con tenantId inválido.`);

    } finally {
        await client.close();
    }
}

cleanup();
