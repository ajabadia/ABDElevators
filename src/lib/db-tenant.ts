/**
 * ⚡ FASE 182/183: Domain Decoupling
 * 🛡️ [SECURITY] Hardening Wave 2: Secure Collection Wrapper
 * Encapsulates @abd/platform-core/server with automatic NoSQL Sanitization.
 */
import { getTenantCollection as getCoreTenantCollection } from '@abd/platform-core/server';
import { MongoSanitizer } from './mongo-sanitizer';
import { Collection } from 'mongodb';

export * from '@abd/platform-core/server';

const VALID_COLLECTION_NAMES = /^[a-z0-9_]+$/i;

/**
 * 🛡️ Wraps getTenantCollection to return a collection with sanitized inputs.
 * Ensures NoSQL injection protection is applied by default.
 */
export async function getTenantCollection<T extends import('mongodb').Document>(
    collectionName: string,
    session?: any,
    cluster: 'AUTH' | 'MAIN' | 'LOGS' | 'CONFIG' = 'MAIN'
): Promise<Collection<T>> {
    // 🛡️ [P1] Collection Name Injection Protection (Wave 3)
    if (!VALID_COLLECTION_NAMES.test(collectionName)) {
        throw new Error(`Invalid collection name: ${collectionName}`);
    }

    const collection = await getCoreTenantCollection<T>(collectionName, session as any, cluster);
    console.log(`📡 [db-tenant] Wrapping collection: ${collectionName} for tenant: ${session?.user?.tenantId}`);

    // Proxy the collection to intercept query methods
    return new Proxy(collection, {
        get(target, prop, receiver) {
            const original = (target as any)[prop];
            if (typeof original !== 'function') return original;

            // session might be undefined if not passed correctly by caller
            const sessionData = (session as any);
            const tenantId = sessionData?.user?.tenantId;

            // 🛡️ Era 12: Protective Guard
            const isSuperAdmin = sessionData?.user?.role === 'SUPER_ADMIN';

            if (!tenantId && !isSuperAdmin && ['find', 'findOne', 'aggregate', 'countDocuments', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'].includes(prop as string)) {
                // If it's a MAIN cluster and no tenant, it might be a platform-wide query (rare, usually requires explicit handling)
                // For now, let's log and throw if critical, or use a safe "platform" fallback if MAIN
                console.warn(`[db-tenant] Accessing collection ${collectionName} without tenantId in session. Trace may be required.`);
            }

            // Methods that return a cursor (Sync)
            const cursorMethods = ['find', 'aggregate'];
            if (cursorMethods.includes(prop as string)) {
                return (...args: any[]) => {
                    if (tenantId && !isSuperAdmin) {
                        if (prop === 'find') {
                            const filter = (args[0] || {}) as Record<string, any>;
                            // Only inject if not already present and not querying 'tenants' (global)
                            if (!filter.tenantId && collectionName !== 'tenants') {
                                filter.tenantId = tenantId;
                            }
                            args[0] = MongoSanitizer.sanitizeQuerySync(filter);
                        } else if (prop === 'aggregate') {
                            let pipeline = (args[0] || []) as any[];
                            if (Array.isArray(pipeline)) {
                                const hasTenantMatch = pipeline.some(stage => stage.$match && stage.$match.tenantId);
                                if (!hasTenantMatch && !isSuperAdmin) {
                                    pipeline = [{ $match: { tenantId } }, ...pipeline];
                                }
                                args[0] = MongoSanitizer.sanitizeQuerySync(pipeline);
                            }
                        }
                    } else {
                        // Sanitize even if no tenant (global query)
                        if (args[0]) args[0] = MongoSanitizer.sanitizeQuerySync(args[0]);
                    }
                    
                    const result = original.apply(target, args);
                    
                    // ⚡ ERA 12: Cursor Polyfill
                    // Fix: Some core collections return a Promise of an Array instead of a standard FindCursor.
                    // We polyfill .toArray(), .limit(), and .sort() on the Promise to maintain compatibility.
                    if (result instanceof Promise) {
                        const p = result as any;
                        if (!p.toArray) p.toArray = () => p;
                        if (!p.limit) p.limit = () => p;
                        if (!p.sort) p.sort = () => p;
                        if (!p.skip) p.skip = () => p;
                        if (!p.project) p.project = () => p;
                    }
                    
                    return result;
                };
            }

            // Methods that return a Promise (Async)
            const asyncFilterMethods = ['findOne', 'countDocuments', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'replaceOne', 'findOneAndDelete', 'findOneAndReplace', 'findOneAndUpdate'];
            if (asyncFilterMethods.includes(prop as string)) {
                return async (...args: unknown[]) => {
                    const filter = (args[0] || {}) as Record<string, any>;
                    if (filter && typeof filter === 'object') {
                        if (tenantId && !isSuperAdmin) filter.tenantId = tenantId;
                        args[0] = await MongoSanitizer.sanitizeQuery(filter);
                    }
                    return original.apply(target, args);
                };
            }

            // Special case for distinct
            if (prop === 'distinct') {
                return async (...args: unknown[]) => {
                    const filter = (args[1] || {}) as Record<string, any>;
                    if (tenantId && !isSuperAdmin) filter.tenantId = tenantId;
                    args[1] = await MongoSanitizer.sanitizeQuery(filter);
                    return original.apply(target, args);
                };
            }

            return original.bind(target);
        }
    }) as any;
}
