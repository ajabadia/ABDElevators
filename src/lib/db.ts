import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { DatabaseError } from './errors';

/**
 * Gestión de conexiones MongoDB para múltiples bases de datos/clústeres.
 * Permite separar Negocio (Main) de Seguridad (Auth).
 */

// Singleton pattern variables for multiple connections
let mainClient: MongoClient;
let mainPromise: Promise<MongoClient> | null = null;

let authClient: MongoClient;
let authPromise: Promise<MongoClient> | null = null;

const options: MongoClientOptions = {};

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

    const connectedClient = await mainPromise;
    // Usamos el nombre de la DB principal
    return connectedClient.db('ABDElevators');
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

    const connectedClient = await authPromise;
    // Usamos un nombre específico para la DB de seguridad
    return connectedClient.db('ABDElevators-Auth');
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

    const connectedClient = await logsPromise;
    // Si tenemos URI específica, usamos 'ABDElevators-Logs', sino la principal
    const dbName = process.env.MONGODB_LOGS_URI ? 'ABDElevators-Logs' : 'ABDElevators';
    return connectedClient.db(dbName);
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
