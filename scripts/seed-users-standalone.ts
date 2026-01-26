import { MongoClient } from 'mongodb';
import { connectDB, connectAuthDB } from '../src/lib/db';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;

async function seed() {
    if (!uri) {
        console.error('❌ MONGODB_URI not found');
        process.exit(1);
    }

    console.log('🌱 Seed: Iniciando carga de usuarios (Standalone v3)...');

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');
        // Usar la base de datos de Auth e Identidad
        const db = client.db('ABDElevators-Auth');
        const usuarios = db.collection('users');

        const adminHash = await bcrypt.hash('admin123', 10);
        const tecnicoHash = await bcrypt.hash('tecnico123', 10);
        const ingenieriaHash = await bcrypt.hash('ingenieria123', 10);

        const usersToSeed = [
            {
                email: 'admin@abd.com',
                password: adminHash,
                nombre: 'Admin',
                apellidos: 'Sistema',
                puesto: 'Administrador de Sistemas',
                rol: 'ADMIN',
                tenantId: 'default_tenant',
                industry: 'ELEVATORS',
                activeModules: ['TECHNICAL', 'RAG'],
                activo: true,
                creado: new Date(),
                modificado: new Date()
            },
            {
                email: 'tecnico@abd.com',
                password: tecnicoHash,
                nombre: 'Técnico',
                apellidos: 'Pruebas',
                puesto: 'Técnico de Campo',
                rol: 'TECNICO',
                tenantId: 'default_tenant',
                industry: 'ELEVATORS',
                activeModules: ['TECHNICAL', 'RAG'],
                activo: true,
                creado: new Date(),
                modificado: new Date()
            },
            {
                email: 'ingenieria@abd.com',
                password: ingenieriaHash,
                nombre: 'Ingeniero',
                apellidos: 'Diseño',
                puesto: 'Ingeniero de Producto',
                rol: 'INGENIERIA',
                tenantId: 'default_tenant',
                industry: 'ELEVATORS',
                activeModules: ['TECHNICAL', 'RAG'],
                activo: true,
                creado: new Date(),
                modificado: new Date()
            }
        ];

        for (const user of usersToSeed) {
            await usuarios.updateOne(
                { email: user.email },
                { $set: user },
                { upsert: true }
            );
            console.log(`✅ Usuario creado/actualizado: ${user.email}`);
        }

        console.log('🚀 Seed completado con éxito');
    } catch (error: any) {
        console.error('❌ Error en seed:', error.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}

seed();
