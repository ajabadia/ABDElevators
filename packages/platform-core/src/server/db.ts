import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { DatabaseError } from '../errors';

const options: MongoClientOptions = {
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 60000,
    connectTimeoutMS: 10000,
};

interface MongoGlobal {
    _mainPromise?: Promise<MongoClient>;
    _authPromise?: Promise<MongoClient>;
    _logsPromise?: Promise<MongoClient>;
}

const globalWithMongo = globalThis as unknown as MongoGlobal;

async function getConnectedClient(uri: string, key: keyof MongoGlobal): Promise<MongoClient> {
    if (!globalWithMongo[key]) {
        const client = new MongoClient(uri, options);
        globalWithMongo[key] = client.connect();
    }

    try {
        return await globalWithMongo[key]!;
    } catch (error) {
        delete globalWithMongo[key];
        throw error;
    }
}

export async function connectDB(): Promise<Db> {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new DatabaseError('Missing MONGODB_URI');

    try {
        const client = await getConnectedClient(uri, '_mainPromise');
        return client.db('ABDElevators');
    } catch (e: any) {
        throw new DatabaseError('Failed to connect to Main DB', e);
    }
}

export async function connectAuthDB(): Promise<Db> {
    const authUri = process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI;
    if (!authUri) throw new DatabaseError('Missing MONGODB_AUTH_URI');

    if (authUri === process.env.MONGODB_URI) {
        const client = await getConnectedClient(process.env.MONGODB_URI as string, '_mainPromise');
        return client.db('ABDElevators-Auth');
    }

    try {
        const client = await getConnectedClient(authUri, '_authPromise');
        return client.db('ABDElevators-Auth');
    } catch (e: any) {
        throw new DatabaseError('Failed to connect to Auth DB', e);
    }
}

export async function connectLogsDB(): Promise<Db> {
    const logsUri = process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI;
    if (!logsUri) throw new DatabaseError('Missing MONGODB_LOGS_URI');

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
        throw new DatabaseError('Failed to connect to Logs DB', e);
    }
}

export async function getMongoClient(): Promise<MongoClient> {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new DatabaseError('Missing MONGODB_URI');
    return await getConnectedClient(uri, '_mainPromise');
}
