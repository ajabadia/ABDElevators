import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

/**
 * MIGRACIÓN DE USUARIOS A BASE DE DATOS DE IDENTIDAD (PRODUCCIÓN/STAGING)
 * 
 * Uso: npx tsx scripts/migrate-production.ts "TU_URI_DE_ATLAS"
 */

async function migrateProduction() {
    const targetUri = process.argv[2];

    if (!targetUri) {
        console.error('❌ Error: Debes proporcionar la URI de MongoDB como primer argumento.');
        console.log('Ejemplo: npx tsx scripts/migrate-production.ts "mongodb+srv://user:pass@cluster.mongodb.net/test"');
        process.exit(1);
    }

    console.log('🚀 Iniciando migración profesional a base de datos de Identidad...');
    console.log(`🔗 Conectando a: ${targetUri.split('@')[1] || 'Cluster oculto'}`);

    let client: MongoClient | null = null;
    try {
        client = new MongoClient(targetUri);
        await client.connect();

        // La lógica de la Identity Suite usa una DB separada llamada 'ABDElevators-Auth'
        // pero en el mismo cluster por defecto.
        const bizDb = client.db('ABDElevators');
        const authDb = client.db('ABDElevators-Auth');

        // 1. Obtener todos los usuarios de la colección legacy 'usuarios'
        const oldUsers = await bizDb.collection('usuarios').find({}).toArray();

        if (oldUsers.length === 0) {
            console.log('ℹ️ No se encontraron usuarios en la colección legacy "usuarios".');
            console.log('Asegúrate de que estás apuntando a la base de datos correcta.');
            return;
        }

        console.log(`📦 Encontrados ${oldUsers.length} usuarios para migrar.`);

        // 2. Migrar a la nueva colección 'users' en la DB de Auth
        for (const user of oldUsers) {
            const { _id, ...userData } = user;

            // Normalizar datos para la nueva suite
            const normalizedUser = {
                ...userData,
                email: userData.email.toLowerCase().trim(),
                updatedAt: new Date()
            };

            await authDb.collection('users').updateOne(
                { email: normalizedUser.email },
                { $set: normalizedUser },
                { upsert: true }
            );
            console.log(`✅ Migrado: ${normalizedUser.email}`);
        }

        // 3. Crear índices necesarios en la nueva DB
        console.log('🛠️ Creando índices de seguridad...');
        await authDb.collection('users').createIndex({ email: 1 }, { unique: true });
        await authDb.collection('mfa_configs').createIndex({ userId: 1 }, { unique: true });

        console.log('✨ Migración completada con éxito.');
        console.log('👉 Tip: No borres la colección original hasta verificar el login en Vercel.');

    } catch (error) {
        console.error('❌ Error crítico durante la migración:', error);
    } finally {
        if (client) await client.close();
        process.exit(0);
    }
}

migrateProduction();
