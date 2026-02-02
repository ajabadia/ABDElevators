
import neo4j, { Driver } from 'neo4j-driver';

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

let driver: Driver;

/**
 * Establishment of Neo4j driver connection (Singleton)
 */
export async function getNeo4jDriver(): Promise<Driver> {
    if (!driver) {
        try {
            driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
            // Verify connectivity
            await driver.verifyConnectivity();
            console.log('[Neo4j] Connected successfully');
        } catch (error) {
            console.error('[Neo4j] Connection failed', error);
            throw error;
        }
    }
    return driver;
}

/**
 * Execute a Cypher query in a session
 */
export async function runQuery(query: string, params: Record<string, any> = {}) {
    const drv = await getNeo4jDriver();
    const session = drv.session();
    try {
        const result = await session.run(query, params);
        return result;
    } finally {
        await session.close();
    }
}

/**
 * Close the driver (use only on app shutdown if necessary)
 */
export async function closeNeo4j() {
    if (driver) {
        await driver.close();
    }
}
