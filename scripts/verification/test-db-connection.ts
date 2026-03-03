import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnoseConnection() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('❌ [DIAGNOSTIC] MONGODB_URI no encontrada en .env.local');
        return;
    }

    console.log('🔍 [DIAGNOSTIC] Intentando conectar a:', uri.replace(/:([^@]+)@/, ':****@'));

    const client = new MongoClient(uri, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
    });

    try {
        const start = Date.now();
        await client.connect();
        const duration = Date.now() - start;
        console.log(`✅ [DIAGNOSTIC] Conexión establecida exitosamente en ${duration}ms`);

        const db = client.db('ABDElevators');
        const collections = await db.listCollections().toArray();
        console.log(`📦 [DIAGNOSTIC] Base de Datos 'ABDElevators' accesible.`);
        console.log(`📋 [DIAGNOSTIC] Colecciones encontradas:`, collections.map(c => c.name).join(', '));

    } catch (error: any) {
        console.error('❌ [DIAGNOSTIC] ERROR DE CONEXIÓN:');
        console.error('---');
        console.error('Mensaje:', error.message);
        console.error('Código:', error.code);

        if (error.message.includes('IP address') || error.message.includes('not whitelisted')) {
            console.warn('\n⚠️  POSIBLE CAUSA: Tu dirección IP actual no está autorizada en MongoDB Atlas Access Control.');
        } else if (error.message.includes('Authentication failed')) {
            console.warn('\n⚠️  POSIBLE CAUSA: Credenciales (usuario/password) incorrectas en MONGODB_URI.');
        } else if (error.message.includes('ETIMEDOUT') || error.message.includes('Server selection timed out')) {
            console.warn('\n⚠️  POSIBLE CAUSA: Problema de red o firewall bloqueando el puerto 27017.');
        }
        console.error('---');
    } finally {
        await client.close();
    }
}

diagnoseConnection();
