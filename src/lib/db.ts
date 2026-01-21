import { MongoClient, Db, MongoClientOptions } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const options: MongoClientOptions = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

/**
 * Retorna la base de datos conectada.
 * Sigue el patrón singleton para evitar múltiples conexiones en serverless.
 */
export async function connectDB(): Promise<Db> {
    const connectedClient = await clientPromise;
    return connectedClient.db('ABDElevators');
}

export default clientPromise;
