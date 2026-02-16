import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function countTenants() {
    // Intentamos construir una URI estándar si la SRV falla
    // Formato: mongodb://user:pass@host1:port,host2:port/?replicaSet=...
    // Pero como no tenemos los hosts individuales, intentaremos forzar el uso de la URI actual 
    // pero desactivando el check de SRV si es posible o simplemente reintentando.

    // NOTA: Algunas redes bloquean SRV. Intentaremos ver si podemos conectar.
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        fs.writeFileSync('tenants_count.txt', 'MONGODB_URI no encontrada en .env.local');
        process.exit(1);
    }

    console.log('Uri Type:', uri.startsWith('mongodb+srv') ? 'SRV' : 'Standard');

    const client = new MongoClient(uri);

    try {
        console.log('Intentando conectar...');
        await client.connect();
        console.log('Conexión exitosa.');

        const db = client.db('ABDElevators');
        const count = await db.collection('tenants').countDocuments();

        // También imprimir los primeros 5 tenants si existen
        const samples = await db.collection('tenants').find({}).limit(5).toArray();

        let report = `Total Tenants: ${count}\n`;
        report += 'Samples:\n';
        samples.forEach(s => {
            report += `- ${s.name} (ID: ${s.tenantId})\n`;
        });

        fs.writeFileSync('tenants_count.txt', report);

    } catch (err: any) {
        fs.writeFileSync('tenants_count.txt', `FAILED: ${err.message}`);
    } finally {
        await client.close();
        process.exit(0);
    }
}

countTenants();
