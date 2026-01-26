import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function countNoMd5() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        const countTecnicos = await db.collection('documentos_tecnicos').countDocuments({ archivo_md5: { $exists: false } });
        const countUsuarios = await db.collection('documentos_usuarios').countDocuments({ archivo_md5: { $exists: false } });
        const countPedidos = await db.collection('pedidos').countDocuments({ archivo_md5: { $exists: false } });

        console.log(`Documentos Técnicos sin MD5: ${countTecnicos}`);
        console.log(`Documentos Usuarios sin MD5: ${countUsuarios}`);
        console.log(`Pedidos sin MD5: ${countPedidos}`);

    } finally {
        await client.close();
    }
}
countNoMd5();
