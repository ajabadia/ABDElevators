import { connectDB } from 'd:/desarrollos/ABDElevators/src/lib/db';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seed() {
    console.log('🌱 Seed: Iniciando carga de usuarios...');

    try {
        const db = await connectDB();
        const usuarios = db.collection('usuarios');

        // Limpiar usuarios existentes (opcional en desarrollo)
        // await usuarios.deleteMany({});

        const usersToSeed = [
            {
                email: 'admin@abd.com',
                password: await bcrypt.hash('admin123', 10),
                nombre: 'Admin',
                apellidos: 'Sistema',
                puesto: 'Administrador de Sistemas',
                rol: 'ADMIN',
                activo: true,
                creado: new Date(),
                modificado: new Date()
            },
            {
                email: 'tecnico@abd.com',
                password: await bcrypt.hash('tecnico123', 10),
                nombre: 'Juan',
                apellidos: 'Pérez',
                puesto: 'Técnico de Mantenimiento',
                rol: 'TECNICO',
                activo: true,
                creado: new Date(),
                modificado: new Date()
            },
            {
                email: 'ingenieria@abd.com',
                password: await bcrypt.hash('ingenieria123', 10),
                nombre: 'Elena',
                apellidos: 'García',
                puesto: 'Ingeniera de Diseño',
                rol: 'INGENIERIA',
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
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    }
}

seed();
