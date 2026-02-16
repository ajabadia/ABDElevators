import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function verify() {
    console.log('\n--- 🧪 Verificando Leakage de Tenant en Raw MongoDB ---');

    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const collection = db.collection('i18n_translations');

        const locale = 'es';

        // Simular lo que haría SecureCollection si no filtrara (o si filtrara mal)
        // Buscamos todas las llaves de ES
        const docs = await collection.find({ locale }).toArray();

        console.log(`Total documentos encontrados para '${locale}': ${docs.length}`);

        const tenantSummary: Record<string, number> = {};
        docs.forEach(d => {
            tenantSummary[d.tenantId] = (tenantSummary[d.tenantId] || 0) + 1;
        });

        console.log('Distribución por Tenant ID:', tenantSummary);

        const keysWithMultipleTenants = new Set();
        const keyMap = new Map();

        docs.forEach(d => {
            if (!keyMap.has(d.key)) keyMap.set(d.key, new Set());
            keyMap.get(d.key).add(d.tenantId);
            if (keyMap.get(d.key).size > 1) keysWithMultipleTenants.add(d.key);
        });

        if (keysWithMultipleTenants.size > 0) {
            console.log(`\n⚠️ Se han encontrado ${keysWithMultipleTenants.size} llaves que existen en MÚLTIPLES tenants.`);
            console.log('Ejemplo:', Array.from(keysWithMultipleTenants)[0]);
        }

    } finally {
        await client.close();
    }
}

verify();
