import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { DatabaseError } from '@/lib/errors';

/**
 * Gestión de conexiones MongoDB para múltiples bases de datos/clústeres.
 * Permite separar Negocio (Main) de Seguridad (Auth).
 */

// Singleton pattern variables for multiple connections
let mainClient: MongoClient;
let mainPromise: Promise<MongoClient> | null = null;

let authClient: MongoClient;
let authPromise: Promise<MongoClient> | null = null;

const options: MongoClientOptions = {
    maxPoolSize: 10, // Limit pool size for serverless
    minPoolSize: 5,  // Maintain a baseline for quick bursts
    maxIdleTimeMS: 60000, // Close idle connections to prevent ghost connections
    connectTimeoutMS: 10000, // Fail fast
};

/**
 * Conexión a la Base de Datos de NEGOCIO (Principal)
 */
export async function connectDB(): Promise<Db> {
    if (!process.env.MONGODB_URI) {
        throw new DatabaseError('Please add your MONGODB_URI to .env.local');
    }

    if (!mainPromise) {
        if (process.env.NODE_ENV === 'development') {
            let globalWithMongo = global as typeof globalThis & {
                _mainMongoPromise?: Promise<MongoClient>;
            };
            if (!globalWithMongo._mainMongoPromise) {
                mainClient = new MongoClient(process.env.MONGODB_URI, options);
                globalWithMongo._mainMongoPromise = mainClient.connect();
            }
            mainPromise = globalWithMongo._mainMongoPromise;
        } else {
            mainClient = new MongoClient(process.env.MONGODB_URI, options);
            mainPromise = mainClient.connect();
        }
    }

    try {
        const connectedClient = await mainPromise;
        // Usamos el nombre de la DB principal
        return connectedClient.db('ABDElevators');
    } catch (e: any) {
        // Log detallado para diagnóstico (Auditoría 015)
        console.error('❌ [DATABASE_ERROR] Error conectando a Main DB:', e?.message || e);
        if (e?.stack) console.error(e.stack);

        // Reset promise on failure so we can retry (Auditoría 015: Clear Global too)
        mainPromise = null;
        if (process.env.NODE_ENV === 'development') {
            delete (global as any)._mainMongoPromise;
        }
        throw new DatabaseError('Failed to connect to Main DB', e as Error);
    }
}

/**
 * Conexión a la Base de Datos de SEGURIDAD (Auth)
 * Puede estar en un clúster de Atlas completamente diferente para mayor seguridad y ahorro de cuotas.
 */
export async function connectAuthDB(): Promise<Db> {
    // Fallback a la URI principal si no se define una específica de AUTH
    const authUri = process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI;

    if (!authUri) {
        throw new DatabaseError('Please add your MONGODB_AUTH_URI or MONGODB_URI to .env.local');
    }

    // Optimization: If URIs are identical, reuse the main connection promise to save sockets
    if (authUri === process.env.MONGODB_URI && mainPromise) {
        try {
            const client = await mainPromise;
            return client.db('ABDElevators-Auth');
        } catch (e) {
            // If mainPromise fails, we handle it in connectDB
            // But let's fall through to establish its own promise if needed
        }
    }

    if (!authPromise) {
        if (process.env.NODE_ENV === 'development') {
            let globalWithMongo = global as typeof globalThis & {
                _authMongoPromise?: Promise<MongoClient>;
            };
            if (!globalWithMongo._authMongoPromise) {
                authClient = new MongoClient(authUri, options);
                globalWithMongo._authMongoPromise = authClient.connect();
            }
            authPromise = globalWithMongo._authMongoPromise;
        } else {
            authClient = new MongoClient(authUri, options);
            authPromise = authClient.connect();
        }
    }

    try {
        const connectedClient = await authPromise;
        return connectedClient.db('ABDElevators-Auth');
    } catch (e) {
        authPromise = null;
        if (process.env.NODE_ENV === 'development') {
            delete (global as any)._authMongoPromise;
        }
        throw new DatabaseError('Failed to connect to Auth DB', e as Error);
    }
}

let logsClient: MongoClient;
let logsPromise: Promise<MongoClient> | null = null;

/**
 * Conexión a la Base de Datos de AUDITORÍA Y LOGS
 * Preparado para separar almacenamiento masivo (Phase 24)
 */
export async function connectLogsDB(): Promise<Db> {
    // Fallback a la URI principal si no se define una específica de LOGS
    const logsUri = process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI;

    if (!logsUri) {
        throw new DatabaseError('Please add your MONGODB_LOGS_URI or MONGODB_URI to .env.local');
    }

    // Optimization: Reuse main connection if URIs match
    if (logsUri === process.env.MONGODB_URI && mainPromise) {
        try {
            const client = await mainPromise;
            const dbName = process.env.MONGODB_LOGS_URI ? 'ABDElevators-Logs' : 'ABDElevators';
            return client.db(dbName);
        } catch (e) {
            // Fallthrough
        }
    }

    if (!logsPromise) {
        if (process.env.NODE_ENV === 'development') {
            let globalWithMongo = global as typeof globalThis & {
                _logsMongoPromise?: Promise<MongoClient>;
            };
            if (!globalWithMongo._logsMongoPromise) {
                logsClient = new MongoClient(logsUri, options);
                globalWithMongo._logsMongoPromise = logsClient.connect();
            }
            logsPromise = globalWithMongo._logsMongoPromise;
        } else {
            logsClient = new MongoClient(logsUri, options);
            logsPromise = logsClient.connect();
        }
    }

    try {
        const connectedClient = await logsPromise;
        const dbName = process.env.MONGODB_LOGS_URI ? 'ABDElevators-Logs' : 'ABDElevators';
        return connectedClient.db(dbName);
    } catch (e) {
        logsPromise = null;
        if (process.env.NODE_ENV === 'development') {
            delete (global as any)._logsMongoPromise;
        }
        throw new DatabaseError('Failed to connect to Logs DB', e as Error);
    }
}

/**
 * Retorna el cliente principal para transacciones
 */
export async function getMongoClient(): Promise<MongoClient> {
    if (!mainPromise) {
        await connectDB();
    }
    return await mainPromise!;
}

export default mainPromise;
