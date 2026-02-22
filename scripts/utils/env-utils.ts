
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * 🔑 Script Environment Utils
 * Proposito: Cargar .env.local de forma consistente en todos los scripts de mantenimiento.
 */
export function loadEnv() {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
    console.log('✅ Environment variables loaded from .env.local');
}

/**
 * Obtiene una variable de entorno requerida o lanza error.
 */
export function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`❌ Missing required environment variable: ${key}`);
    }
    return value;
}
