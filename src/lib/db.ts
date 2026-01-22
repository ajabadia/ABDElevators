import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import { DatabaseError } from './errors';

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

/**
 * Retorna la base de datos conectada.
 * Sigue el patrón singleton para evitar múltiples conexiones en serverless.
 * Valida el entorno solo al momento de conectar.
 */
export async function connectDB(): Promise<Db> {
    if (!process.env.MONGODB_URI) {
        throw new DatabaseError('Please add your Mongo URI to .env.local');
    }

    if (!clientPromise) {
        const uri = process.env.MONGODB_URI;
        const options: MongoClientOptions = {};

        if (process.env.NODE_ENV === 'development') {
            let globalWithMongo = global as typeof globalThis & {
                _mongoClientPromise?: Promise<MongoClient>;
            };
            if (!globalWithMongo._mongoClientPromise) {
                client = new MongoClient(uri, options);
                globalWithMongo._mongoClientPromise = client.connect();
            }
            clientPromise = globalWithMongo._mongoClientPromise;
        } else {
            client = new MongoClient(uri, options);
            clientPromise = client.connect();
        }
    }

    const connectedClient = await clientPromise;
    return connectedClient.db('ABDElevators');
}

export default clientPromise;
