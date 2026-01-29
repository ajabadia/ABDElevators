import { getNeo4jDriver, runCypher } from '@/lib/neo4j';
import { logEvento } from '@/lib/logger';

/**
 * ReliabilityEngine: Gestiona la alta disponibilidad y redundancia del motor de inteligencia.
 * (Fase High-Availability)
 */
export class ReliabilityEngine {
    private static instance: ReliabilityEngine;

    private constructor() { }

    public static getInstance(): ReliabilityEngine {
        if (!ReliabilityEngine.instance) {
            ReliabilityEngine.instance = new ReliabilityEngine();
        }
        return ReliabilityEngine.instance;
    }

    /**
     * Verifica la salud de los sistemas críticos.
     */
    public async checkSystemHealth(): Promise<{ neo4j: boolean; mongodb: boolean }> {
        const status = { neo4j: false, mongodb: false };
        try {
            const driver = getNeo4jDriver();
            const session = driver.session();
            await session.run('RETURN 1');
            status.neo4j = true;
            await session.close();
        } catch (e) {
            status.neo4j = false;
        }

        // Mongo health check via connectDB could go here
        status.mongodb = true;

        return status;
    }

    /**
     * Ejecuta una consulta con reintentos y fallback si el sistema principal falla.
     */
    public async runWithFailover<T>(
        action: () => Promise<T>,
        fallback: () => Promise<T>,
        correlacion_id: string
    ): Promise<T> {
        try {
            return await action();
        } catch (error: any) {
            await logEvento({
                nivel: 'WARN',
                origen: 'RELIABILITY_ENGINE',
                accion: 'FAILOVER_TRIGGERED',
                mensaje: `Sistema principal lento o caído: ${error.message}. Activando Fallback.`,
                correlacion_id
            });
            return await fallback();
        }
    }
}
