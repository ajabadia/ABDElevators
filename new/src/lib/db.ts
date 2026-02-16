import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { DatabaseError } from '@/lib/errors';

/**
 * Gestión de conexiones MongoDB para múltiples bases de datos/clústeres.
 * Optimizado para Serverless (Vercel) evitando fugas de sockets (Auditoría P0).
 */

const options: MongoClientOptions = {
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 60000,
    connectTimeoutMS: 10000,
};

// Extender globalThis para mantener las promesas de conexión en desarrollo (HMR)
interface MongoGlobal {
    _mainPromise?: Promise<MongoClient>;
    _authPromise?: Promise<MongoClient>;
    _logsPromise?: Promise<MongoClient>;
}

const globalWithMongo = globalThis as unknown as MongoGlobal;

/**
 * Crea o recupera una conexión de forma segura (Singleton)
 */
async function getConnectedClient(uri: string, key: keyof MongoGlobal): Promise<MongoClient> {
    if (!globalWithMongo[key]) {
        const client = new MongoClient(uri, options);
        globalWithMongo[key] = client.connect();
    }

    try {
        return await globalWithMongo[key]!;
    } catch (error) {
        // Si falla, limpiar la promesa para permitir reintentos
        delete globalWithMongo[key];
        throw error;
    }
}

/**
 * Conexión a la Base de Datos de NEGOCIO (Principal)
 */
export async function connectDB(): Promise<Db> {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new DatabaseError('Missing MONGODB_URI');

    try {
        const client = await getConnectedClient(uri, '_mainPromise');
        return client.db('ABDElevators');
    } catch (e: any) {
        console.error('❌ [DATABASE_ERROR] Main DB:', e?.message);
        throw new DatabaseError('Failed to connect to Main DB', e);
    }
}

/**
 * Conexión a la Base de Datos de SEGURIDAD (Auth)
 */
export async function connectAuthDB(): Promise<Db> {
    const authUri = process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI;
    if (!authUri) throw new DatabaseError('Missing MONGODB_AUTH_URI');

    // Optimización: Reutilizar conexión principal si las URIs son idénticas
    if (authUri === process.env.MONGODB_URI) {
        const client = await getConnectedClient(process.env.MONGODB_URI as string, '_mainPromise');
        return client.db('ABDElevators-Auth');
    }

    try {
        const client = await getConnectedClient(authUri, '_authPromise');
        return client.db('ABDElevators-Auth');
    } catch (e: any) {
        console.error('❌ [DATABASE_ERROR] Auth DB:', e?.message);
        throw new DatabaseError('Failed to connect to Auth DB', e);
    }
}

/**
 * Conexión a la Base de Datos de AUDITORÍA Y LOGS
 */
export async function connectLogsDB(): Promise<Db> {
    const logsUri = process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI;
    if (!logsUri) throw new DatabaseError('Missing MONGODB_LOGS_URI');

    // Optimización: Reutilizar conexión principal si las URIs son idénticas
    if (logsUri === process.env.MONGODB_URI) {
        const db = await connectDB();
        const dbName = process.env.MONGODB_LOGS_URI ? 'ABDElevators-Logs' : 'ABDElevators';
        return db.client.db(dbName);
    }

    try {
        const client = await getConnectedClient(logsUri, '_logsPromise');
        const dbName = process.env.MONGODB_LOGS_URI ? 'ABDElevators-Logs' : 'ABDElevators';
        return client.db(dbName);
    } catch (e: any) {
        console.error('❌ [DATABASE_ERROR] Logs DB:', e?.message);
        throw new DatabaseError('Failed to connect to Logs DB', e);
    }
}

/**
 * Retorna el cliente principal para transacciones
 */
export async function getMongoClient(): Promise<MongoClient> {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new DatabaseError('Missing MONGODB_URI');
    return await getConnectedClient(uri, '_mainPromise');
}

export default getMongoClient();
