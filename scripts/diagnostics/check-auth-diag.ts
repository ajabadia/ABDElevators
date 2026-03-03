import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;

async function check() {
    if (!uri) {
        console.error('❌ MONGODB_URI not found');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const usuarios = db.collection('usuarios');

        const email = 'admin@abd.com';
        const user = await usuarios.findOne({ email });

        if (user) {
            console.log('✅ Usuario encontrado:', user.email);
            console.log('🔹 Rol:', user.rol);
            console.log('🔹 TenantId:', user.tenantId);
            console.log('🔹 Industry:', user.industry);
            console.log('🔹 Activo:', user.active);
            console.log('🔹 Password (hash length):', user.password?.length);
        } else {
            console.log('❌ Usuario NO encontrado:', email);
            const allUsers = await usuarios.find({}, { projection: { email: 1 } }).toArray();
            console.log('👥 Usuarios existentes:', allUsers.map(u => u.email));
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}

check();
