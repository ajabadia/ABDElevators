import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver | null = null;

/**
 * Obtiene la instancia del driver de Neo4j (Singleton).
 */
export function getNeo4jDriver(): Driver {
    if (driver) return driver;

    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const username = process.env.NEO4J_USERNAME || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    try {
        driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
        return driver;
    } catch (error) {
        console.error('Error al conectar con Neo4j:', error);
        throw error;
    }
}

/**
 * Cierra la conexión con Neo4j.
 */
export async function closeNeo4j() {
    if (driver) {
        await driver.close();
        driver = null;
    }
}

// Cache simple para consultas pesadas (Fase Scale Optimization)
const cypherCache = new Map<string, { result: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos

/**
 * Ejecuta una consulta Cypher de forma segura con caché opcional.
 */
export async function runCypher(query: string, params: Record<string, any> = {}, useCache = false) {
    const cacheKey = JSON.stringify({ query, params });

    if (useCache) {
        const cached = cypherCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.result;
        }
    }

    const driver = getNeo4jDriver();
    const session = driver.session();
    try {
        const result = await session.run(query, params);

        if (useCache) {
            cypherCache.set(cacheKey, { result, timestamp: Date.now() });
        }

        return result;
    } finally {
        await session.close();
    }
}
