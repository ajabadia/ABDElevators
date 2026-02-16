import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkDocs() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        const docs = await db.collection('documentos_tecnicos').find({}).toArray();
        let out = '--- DOCUMENTOS TÉCNICOS ---\n';
        docs.forEach(d => {
            out += `ID: ${d._id} | NOMBRE: ${d.nombre_archivo} | TENANT: ${d.tenantId} | CREADO: ${d.creado}\n`;
        });

        const chunks = await db.collection('document_chunks').distinct('origen_doc');
        out += '\n--- ORIGEN DE CHUNKS EXISTENTES ---\n';
        chunks.forEach(c => out += `ORIGEN: ${c}\n`);

        fs.writeFileSync('docs_debug.txt', out);
    } finally {
        await client.close();
    }
}
checkDocs();
