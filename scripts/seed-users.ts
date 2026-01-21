import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI no está definida en .env.local');
}

const usuarios = [
    {
        email: 'admin@abd.com',
        password: 'admin123',
        nombre: 'Administrador',
        rol: 'ADMIN',
    },
    {
        email: 'tecnico@abd.com',
        password: 'tecnico123',
        nombre: 'Técnico Taller',
        rol: 'TECNICO',
    },
    {
        email: 'ingenieria@abd.com',
        password: 'ingenieria123',
        nombre: 'Ingeniero',
        rol: 'INGENIERIA',
    },
];

async function seedUsers() {
    const client = new MongoClient(MONGODB_URI as string);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');

        const db = client.db('ABDElevators');
        const collection = db.collection('usuarios');

        // Limpiar usuarios existentes
        await collection.deleteMany({});
        console.log('🗑️  Usuarios anteriores eliminados');

        // Hashear contraseñas e insertar
        const usuariosHasheados = await Promise.all(
            usuarios.map(async (usuario) => ({
                ...usuario,
                password: await bcrypt.hash(usuario.password, 10),
                creado: new Date(),
            }))
        );

        await collection.insertMany(usuariosHasheados);
        console.log('✅ Usuarios creados exitosamente:');
        usuarios.forEach((u) => {
            console.log(`   - ${u.email} (${u.rol}) - Password: ${u.password}`);
        });
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

seedUsers();
