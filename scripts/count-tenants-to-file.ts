import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function countTenants() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        fs.writeFileSync('tenants_count.txt', 'MONGODB_URI no encontrada en .env.local');
        process.exit(1);
    }

    // El error ENOTFOUND suele ser por problemas de red o porque el SRV no resuelve.
    // Intentaremos usar el cliente con opciones más robustas.
    const client = new MongoClient(uri, {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
    });

    try {
        console.log('Conectando a MongoDB...');
        await client.connect();

        // El nombre de la base de datos es ABDElevators según src/lib/db.ts
        const db = client.db('ABDElevators');

        // Listar colecciones para ver qué hay
        const collections = await db.listCollections().toArray();
        console.log('Colecciones encontradas:', collections.map(c => c.name));

        const tenantsColl = db.collection('tenants');
        const total = await tenantsColl.countDocuments();

        let output = `📊 Total de tenants registrados: ${total}\n`;
        output += '-----------------------------------\n';

        if (total > 0) {
            const tenants = await tenantsColl.find({}, { projection: { name: 1, tenantId: 1 } }).toArray();
            tenants.forEach(t => {
                output += `- ${t.name} (${t.tenantId})\n`;
            });
        } else {
            output += 'No se encontraron tenants en la colección.\n';
        }
        output += '-----------------------------------\n';

        fs.writeFileSync('tenants_count.txt', output);
        console.log('Resultados escritos en tenants_count.txt');

    } catch (error: any) {
        const errorMsg = `Error: ${error.message}\nStack: ${error.stack}`;
        console.error(errorMsg);
        fs.writeFileSync('tenants_count.txt', errorMsg);
    } finally {
        await client.close();
        process.exit(0);
    }
}

countTenants();
