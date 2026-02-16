import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;

async function resetAndSeed() {
    if (!uri) {
        console.error('❌ MONGODB_URI not found in .env.local');
        process.exit(1);
    }

    console.log('🧹 Iniciando limpieza y carga de usuarios...');

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        const db = client.db('ABDElevators-Auth');
        const usersCollection = db.collection('users');

        // 1. Borrar todos los usuarios existentes
        console.log('🗑️ Borrando todos los usuarios existentes en ABDElevators-Auth.users...');
        const deleteResult = await usersCollection.deleteMany({});
        console.log(`✅ Usuarios borrados: ${deleteResult.deletedCount}`);

        // 2. Definir usuarios según README.md
        const usersToSeed = [
            {
                email: 'admin@abd.com',
                passwordPlain: 'admin123',
                firstName: 'Admin',
                lastName: 'System',
                role: 'SUPER_ADMIN'
            },
            {
                email: 'tecnico@abd.com',
                passwordPlain: 'tecnico123',
                firstName: 'Técnico',
                lastName: 'General',
                role: 'TECHNICAL'
            },
            {
                email: 'ingenieria@abd.com',
                passwordPlain: 'ingenieria123',
                firstName: 'Ingeniero',
                lastName: 'Jefe',
                role: 'ENGINEERING'
            }
        ];

        // 3. Insertar nuevos usuarios con passwords hasheados
        for (const u of usersToSeed) {
            const hashedPassword = await bcrypt.hash(u.passwordPlain, 10);
            await usersCollection.insertOne({
                email: u.email,
                password: hashedPassword,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`✅ Usuario creado: ${u.email} (Password: ${u.passwordPlain})`);
        }

        console.log('🚀 Base de datos de usuarios reseteada con éxito');
    } catch (error: any) {
        console.error('❌ Error fatal:', error.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}

resetAndSeed();
