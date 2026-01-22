import { connectDB } from './db';
import { auth } from './auth';
import { AppError } from './errors';
import { Pedido, GenericCase } from './schemas';

/**
 * Helper para obtener la colección de MongoDB con aislamiento por tenant.
 * Regla de Oro: El aislamiento es sagrado.
 */
export async function getTenantCollection(collectionName: string) {
    let session = null;
    try {
        session = await auth();
    } catch (e) {
        // En scripts, auth() puede fallar; seguimos adelante
    }
    const db = await connectDB();

    // Obtenemos el tenantId de la sesión o del entorno (para modo single-tenant configurable)
    const tenantId = session?.user?.tenantId || process.env.SINGLE_TENANT_ID;

    if (!tenantId) {
        throw new AppError('UNAUTHORIZED', 401, 'No se pudo determinar el contexto del Tenant');
    }

    const collection = db.collection(collectionName);

    // Retornamos un proxy o wrapper que inyecte el tenantId en los filtros
    return {
        collection,
        tenantId,
        // Helper para filtros consistentes
        withTenant: (query: any = {}) => ({ ...query, tenantId })
    };
}

/**
 * Helper específico para Casos Genéricos (Visión 2.0).
 */
export async function getCaseCollection() {
    return await getTenantCollection('casos');
}
