import { Redis, RedisOptions } from 'ioredis';
import { AppError } from './errors';

const redisOptions: RedisOptions = {
    maxRetriesPerRequest: null, // Requerido por BullMQ
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
};

let redisConnection: Redis;

/**
 * Obtiene la conexión singleton a Redis para colas de trabajo.
 */
export function getRedisConnection(): Redis {
    if (!process.env.REDIS_URL) {
        // En desarrollo, si no hay Redis, podemos lanzar un aviso pero no bloquear
        // a menos que se intente usar la cola.
        if (process.env.NODE_ENV === 'production') {
            throw new AppError('EXTERNAL_SERVICE_ERROR', 503, 'REDIS_URL no configurada para Async Jobs');
        }
    }

    if (!redisConnection) {
        redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', redisOptions);

        redisConnection.on('error', (error) => {
            console.error('Redis Connection Error:', error);
        });

        redisConnection.on('connect', () => {
            console.log('🚀 Redis Connected for Async Jobs');
        });
    }

    return redisConnection;
}

export default redisConnection!;
