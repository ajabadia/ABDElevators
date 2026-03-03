import { connectDB, connectAuthDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Script de Migración: De Business DB (usuarios) a Auth DB (users)
 * Diseñado para la Phase 11 & Identity Suite.
 */
async function migrateUsers() {
    console.log('🚀 Iniciando migración de usuarios a la BD de Identidad...');

    try {
        const bizDb = await connectDB();
        const authDb = await connectAuthDB();

        // 1. Obtener todos los usuarios de la BD antigua
        const oldUsers = await bizDb.collection('usuarios').find({}).toArray();

        if (oldUsers.length === 0) {
            console.log('ℹ️ No se encontraron usuarios en la colección "usuarios" de la BD de negocio.');
            process.exit(0);
        }

        console.log(`📦 Encontrados ${oldUsers.length} usuarios para migrar.`);

        // 2. Insertar/Actualizar en la nueva DB
        for (const user of oldUsers) {
            const { _id, ...userData } = user; // Quitamos el _id original para que no choque si los tipos cambian

            // Aseguramos compatibilidad con el nuevo nombre de colección 'users'
            await authDb.collection('users').updateOne(
                { email: user.email },
                { $set: userData },
                { upsert: true }
            );
            console.log(`✅ Migrado: ${user.email}`);
        }

        console.log('✨ Migración completada con éxito.');
        console.log('⚠️ Nota: Ahora puedes borrar la colección "usuarios" de tu clúster de negocio para limpiar espacio.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    }
}

migrateUsers();
